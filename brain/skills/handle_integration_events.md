# Skill: Handle Integration Events (MassTransit)

## Overview

Integration Events dùng để giao tiếp giữa các Bounded Contexts/Microservices qua Message Bus.

**Trigger:** Use this skill when services need to communicate (e.g. OMS -> WMS), or for async processing via RabbitMQ/Kafka.

## Event Types Strategy

### 1. Event Naming Convention

```
[Entity][Action]IntegrationEvent
```

Examples:

- `OrderCreatedIntegrationEvent`
- `InventoryReservedIntegrationEvent`
- `ShipmentDispatchedIntegrationEvent`

### 2. Event Structure (Shared Contracts)

**Location:** Tạo shared project `Contracts` để share events giữa services.

```
src/
  Contracts/
    Events/
      OrderCreatedIntegrationEvent.cs
      InventoryReservedIntegrationEvent.cs
```

**Example:**

```csharp
namespace Contracts.Events;

/// <summary>
/// Published by OMS when an order is created.
/// Consumed by: WMS (inventory reservation), TMS (route planning), Notification (email).
/// </summary>
public sealed record OrderCreatedIntegrationEvent
{
    public Guid OrderId { get; init; }
    public string CustomerId { get; init; }
    public List<OrderLineItem> Items { get; init; }
    public decimal TotalAmount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public sealed record OrderLineItem
{
    public string Sku { get; init; }
    public int Quantity { get; init; }
    public string WarehouseId { get; init; }
}
```

## Publishing Events (Producer Side)

### Option A: Explicit Publish (Simple Cases)

```csharp
namespace Application.Features.Orders.Commands.CreateOrder;

internal sealed class CreateOrderHandler(
    IApplicationDbContext context,
    IPublishEndpoint publishEndpoint, // MassTransit
    ILogger<CreateOrderHandler> logger
) : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        // 1. Business logic
        var order = Order.Create(request.CustomerId, request.Items);

        context.Orders.Add(order);
        await context.SaveChangesAsync(cancellationToken);

        // 2. Publish integration event
        await publishEndpoint.Publish(new OrderCreatedIntegrationEvent
        {
            OrderId = order.Id,
            CustomerId = order.CustomerId,
            Items = order.Items.Select(i => new OrderLineItem
            {
                Sku = i.Sku,
                Quantity = i.Quantity,
                WarehouseId = i.WarehouseId
            }).ToList(),
            TotalAmount = order.TotalAmount,
            CreatedAt = DateTime.UtcNow
        }, cancellationToken);

        return Result<Guid>.Success(order.Id);
    }
}
```

### Option B: Outbox Pattern (Recommended for Production)

**Why?** Guarantees event is published even if service crashes after DB save.

```csharp
// Configure in Program.cs
builder.Services.AddMassTransit(x =>
{
    x.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
    {
        o.UsePostgres();
        o.UseBusOutbox(); // Critical: enables outbox pattern
    });

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");
        cfg.ConfigureEndpoints(context);
    });
});
```

**Usage stays the same, but MassTransit now stores events in DB first:**

```csharp
// Same code as Option A, but MassTransit intercepts and uses Outbox table
await publishEndpoint.Publish(new OrderCreatedIntegrationEvent {...}, cancellationToken);
```

## Consuming Events (Consumer Side)

### Step 1: Define Consumer

```csharp
namespace WMS.Application.Consumers;

/// <summary>
/// Listens to OrderCreated events from OMS to reserve inventory.
/// </summary>
public class OrderCreatedConsumer(
    IApplicationDbContext context,
    IPublishEndpoint publishEndpoint,
    ILogger<OrderCreatedConsumer> logger
) : IConsumer<OrderCreatedIntegrationEvent>
{
    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var @event = context.Message;

        logger.LogInformation("Received OrderCreated event for Order {OrderId}", @event.OrderId);

        try
        {
            // Business logic: Reserve inventory
            foreach (var item in @event.Items)
            {
                var inventory = await context.Inventories
                    .FirstOrDefaultAsync(i => i.Sku == item.Sku && i.WarehouseId == item.WarehouseId);

                if (inventory == null || inventory.AvailableQty < item.Quantity)
                {
                    // Publish failure event (Saga Compensation)
                    await publishEndpoint.Publish(new InventoryReservationFailedIntegrationEvent
                    {
                        OrderId = @event.OrderId,
                        Sku = item.Sku,
                        Reason = "Insufficient stock"
                    });

                    logger.LogWarning("Insufficient stock for SKU {Sku}", item.Sku);
                    return; // Exit early
                }

                // Reserve inventory
                inventory.ReservedQty += item.Quantity;
            }

            await context.SaveChangesAsync();

            // Publish success event
            await publishEndpoint.Publish(new InventoryReservedIntegrationEvent
            {
                OrderId = @event.OrderId,
                ReservedAt = DateTime.UtcNow
            });

            logger.LogInformation("Inventory reserved successfully for Order {OrderId}", @event.OrderId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error reserving inventory for Order {OrderId}", @event.OrderId);
            throw; // Let MassTransit retry
        }
    }
}
```

### Step 2: Register Consumer

```csharp
// In WMS.Api/Program.cs
builder.Services.AddMassTransit(x =>
{
    // Register all consumers in assembly
    x.AddConsumers(typeof(OrderCreatedConsumer).Assembly);

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");

        // Configure specific queue settings
        cfg.ReceiveEndpoint("wms-order-created-queue", e =>
        {
            e.ConfigureConsumer<OrderCreatedConsumer>(context);

            // Retry policy
            e.UseMessageRetry(r => r.Intervals(
                TimeSpan.FromSeconds(5),
                TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(30)
            ));
        });
    });
});
```

## Handling Idempotency (CRITICAL)

Integration events might be delivered **more than once** (at-least-once delivery).

### Pattern: Inbox State Table

```csharp
// In WMS database
public class InboxState
{
    public Guid MessageId { get; set; }
    public string ConsumerType { get; set; }
    public DateTime ProcessedAt { get; set; }
}

// In Consumer
public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
{
    var messageId = context.MessageId ?? throw new InvalidOperationException("MessageId missing");

    // Check if already processed
    var alreadyProcessed = await _context.InboxStates
        .AnyAsync(i => i.MessageId == messageId);

    if (alreadyProcessed)
    {
        _logger.LogInformation("Message {MessageId} already processed. Skipping.", messageId);
        return; // Idempotent exit
    }

    // Process message
    // ...

    // Mark as processed
    _context.InboxStates.Add(new InboxState
    {
        MessageId = messageId.Value,
        ConsumerType = nameof(OrderCreatedConsumer),
        ProcessedAt = DateTime.UtcNow
    });

    await _context.SaveChangesAsync();
}
```

## Error Handling Strategies

### 1. Transient Errors (Network issues, DB timeouts)

**Strategy:** Retry with exponential backoff

```csharp
e.UseMessageRetry(r => r.Exponential(
    retryLimit: 5,
    minInterval: TimeSpan.FromSeconds(5),
    maxInterval: TimeSpan.FromMinutes(5),
    intervalDelta: TimeSpan.FromSeconds(10)
));
```

### 2. Poison Messages (Bad data, unrecoverable errors)

**Strategy:** Move to Dead Letter Queue (DLQ)

```csharp
e.UseMessageRetry(r => r.Intervals(
    TimeSpan.FromSeconds(5),
    TimeSpan.FromSeconds(10),
    TimeSpan.FromSeconds(30)
));

// After retries exhausted, move to error queue
e.DiscardFaultedMessages(); // Or: e.UseDeadLetterQueue()
```

## Testing Integration Events

### Unit Test: Consumer Logic

```csharp
[Fact]
public async Task Consume_WhenInventoryAvailable_ShouldReserveStock()
{
    // Arrange
    var @event = new OrderCreatedIntegrationEvent
    {
        OrderId = Guid.NewGuid(),
        Items = new List<OrderLineItem>
        {
            new() { Sku = "SKU123", Quantity = 10, WarehouseId = "WH01" }
        }
    };

    _dbContext.Inventories.Add(new Inventory
    {
        Sku = "SKU123",
        WarehouseId = "WH01",
        QuantityOnHand = 100,
        ReservedQty = 0
    });
    await _dbContext.SaveChangesAsync();

    var consumeContext = Substitute.For<ConsumeContext<OrderCreatedIntegrationEvent>>();
    consumeContext.Message.Returns(@event);

    var consumer = new OrderCreatedConsumer(_dbContext, _publishEndpoint, _logger);

    // Act
    await consumer.Consume(consumeContext);

    // Assert
    var inventory = await _dbContext.Inventories.FirstAsync();
    inventory.ReservedQty.Should().Be(10);

    await _publishEndpoint.Received(1).Publish(
        Arg.Is<InventoryReservedIntegrationEvent>(e => e.OrderId == @event.OrderId),
        Arg.Any<CancellationToken>()
    );
}
```

### Integration Test: End-to-End

Use **MassTransit.TestFramework** or **Testcontainers** with real RabbitMQ.

## Best Practices Checklist

- [ ] Events are immutable (`sealed record` with `init`)
- [ ] Events have clear naming (`[Entity][Action]IntegrationEvent`)
- [ ] Consumers are idempotent (Inbox pattern)
- [ ] Retry policies configured (3-5 retries with backoff)
- [ ] Outbox pattern enabled for critical events
- [ ] Correlation IDs propagated (`context.CorrelationId`)
- [ ] Error handling (try-catch with logging)
- [ ] Dead letter queue configured for poison messages
