# Skill: Implement Saga Pattern (Distributed Transactions)

## Overview

Saga Pattern quản lý distributed transactions qua nhiều services. Thay vì ACID transaction, Saga dùng **Compensating Transactions** để rollback khi có lỗi.

**Trigger:** Use this skill for complex multi-step workflows across services that require rollback/compensation (e.g. Order Fulfillment).

## Saga Types

| Type              | Use Case                    | Implementation                      |
| ----------------- | --------------------------- | ----------------------------------- |
| **Choreography**  | Simple flows (2-3 services) | Events only, no coordinator         |
| **Orchestration** | Complex flows (4+ services) | Central coordinator (State Machine) |

**Recommendation:** Dùng **Orchestration** với MassTransit State Machine cho logistics flows.

## Example: Order Fulfillment Saga

### Business Flow

```
1. OMS: Create Order
2. WMS: Reserve Inventory → Success/Fail
   ↓ Success
3. TMS: Plan Route → Success/Fail
   ↓ Success
4. Payment: Charge Customer → Success/Fail
   ↓ Success
5. WMS: Pack Order
6. TMS: Dispatch Shipment
   ↓ Complete

If any step fails → Compensate (rollback previous steps)
```

## Implementation Steps

### Step 1: Define Saga State

```csharp
namespace Application.Sagas.OrderFulfillment;

/// <summary>
/// Holds the state of an Order Fulfillment Saga.
/// Persisted in database (SagaRepository).
/// </summary>
public class OrderFulfillmentState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; } // Primary key (OrderId)

    // Current state
    public string CurrentState { get; set; }

    // Saga data
    public Guid OrderId { get; set; }
    public string CustomerId { get; set; }
    public decimal TotalAmount { get; set; }

    // Flags for compensation
    public bool InventoryReserved { get; set; }
    public bool RouteCreated { get; set; }
    public bool PaymentCharged { get; set; }

    // Timeout handling
    public Guid? TimeoutTokenId { get; set; }
}
```

### Step 2: Define Events (Commands/Responses)

```csharp
// Commands (what Saga sends to services)
public record ReserveInventoryCommand(Guid OrderId, List<OrderLineItem> Items);
public record ReleaseInventoryCommand(Guid OrderId); // Compensation

public record CreateRouteCommand(Guid OrderId, string WarehouseId, string DeliveryAddress);
public record CancelRouteCommand(Guid OrderId); // Compensation

public record ChargePaymentCommand(Guid OrderId, decimal Amount, string CustomerId);
public record RefundPaymentCommand(Guid OrderId); // Compensation

// Responses (what services send back)
public record InventoryReservedEvent(Guid OrderId);
public record InventoryReservationFailedEvent(Guid OrderId, string Reason);

public record RouteCreatedEvent(Guid OrderId, Guid RouteId);
public record RouteCreationFailedEvent(Guid OrderId, string Reason);

public record PaymentChargedEvent(Guid OrderId, string TransactionId);
public record PaymentFailedEvent(Guid OrderId, string Reason);
```

### Step 3: Define Saga State Machine

```csharp
namespace Application.Sagas.OrderFulfillment;

public class OrderFulfillmentSaga : MassTransitStateMachine<OrderFulfillmentState>
{
    public OrderFulfillmentSaga()
    {
        // Define states
        InstanceState(x => x.CurrentState);

        // Define events
        Event(() => OrderCreated, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => InventoryReserved, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => InventoryReservationFailed, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => RouteCreated, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => RouteCreationFailed, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => PaymentCharged, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => PaymentFailed, x => x.CorrelateById(m => m.Message.OrderId));

        // Define workflow
        Initially(
            When(OrderCreated)
                .Then(context =>
                {
                    context.Saga.OrderId = context.Message.OrderId;
                    context.Saga.CustomerId = context.Message.CustomerId;
                    context.Saga.TotalAmount = context.Message.TotalAmount;
                })
                .Send(new Uri("queue:wms-commands"), context => new ReserveInventoryCommand(
                    context.Saga.OrderId,
                    context.Message.Items
                ))
                .TransitionTo(ReservingInventory)
        );

        During(ReservingInventory,
            When(InventoryReserved)
                .Then(context => context.Saga.InventoryReserved = true)
                .Send(new Uri("queue:tms-commands"), context => new CreateRouteCommand(
                    context.Saga.OrderId,
                    context.Message.WarehouseId,
                    context.Message.DeliveryAddress
                ))
                .TransitionTo(CreatingRoute),

            When(InventoryReservationFailed)
                .Then(context => Console.WriteLine($"Inventory reservation failed: {context.Message.Reason}"))
                .TransitionTo(Failed)
                .Finalize()
        );

        During(CreatingRoute,
            When(RouteCreated)
                .Then(context => context.Saga.RouteCreated = true)
                .Send(new Uri("queue:payment-commands"), context => new ChargePaymentCommand(
                    context.Saga.OrderId,
                    context.Saga.TotalAmount,
                    context.Saga.CustomerId
                ))
                .TransitionTo(ChargingPayment),

            When(RouteCreationFailed)
                .TransitionTo(CompensatingInventory)
        );

        During(ChargingPayment,
            When(PaymentCharged)
                .Then(context => context.Saga.PaymentCharged = true)
                .TransitionTo(Completed)
                .Finalize(),

            When(PaymentFailed)
                .TransitionTo(CompensatingRoute)
        );

        // Compensation flows (rollback)
        During(CompensatingRoute,
            When(RouteCreated) // Ensure route was actually created before canceling
                .Send(new Uri("queue:tms-commands"), context => new CancelRouteCommand(context.Saga.OrderId))
                .TransitionTo(CompensatingInventory)
        );

        During(CompensatingInventory,
            When(InventoryReserved) // Ensure inventory was reserved before releasing
                .Send(new Uri("queue:wms-commands"), context => new ReleaseInventoryCommand(context.Saga.OrderId))
                .TransitionTo(Failed)
                .Finalize()
        );

        SetCompletedWhenFinalized();
    }

    // States
    public State ReservingInventory { get; private set; }
    public State CreatingRoute { get; private set; }
    public State ChargingPayment { get; private set; }
    public State CompensatingRoute { get; private set; }
    public State CompensatingInventory { get; private set; }
    public State Failed { get; private set; }

    // Events
    public Event<OrderCreatedIntegrationEvent> OrderCreated { get; private set; }
    public Event<InventoryReservedEvent> InventoryReserved { get; private set; }
    public Event<InventoryReservationFailedEvent> InventoryReservationFailed { get; private set; }
    public Event<RouteCreatedEvent> RouteCreated { get; private set; }
    public Event<RouteCreationFailedEvent> RouteCreationFailed { get; private set; }
    public Event<PaymentChargedEvent> PaymentCharged { get; private set; }
    public Event<PaymentFailedEvent> PaymentFailed { get; private set; }
}
```

### Step 4: Configure Saga in Program.cs

```csharp
builder.Services.AddMassTransit(x =>
{
    // Register saga
    x.AddSagaStateMachine<OrderFulfillmentSaga, OrderFulfillmentState>()
        .EntityFrameworkRepository(r =>
        {
            r.ConcurrencyMode = ConcurrencyMode.Pessimistic; // Prevents race conditions
            r.AddDbContext<DbContext, ApplicationDbContext>((provider, cfg) =>
            {
                cfg.UseNpgsql(connectionString);
            });
        });

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host("rabbitmq://localhost");
        cfg.ConfigureEndpoints(context);
    });
});
```

### Step 5: Start Saga (from OMS Service)

```csharp
// In CreateOrderHandler
public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
{
    var order = Order.Create(request.CustomerId, request.Items);
    context.Orders.Add(order);
    await context.SaveChangesAsync(cancellationToken);

    // Kick off saga
    await publishEndpoint.Publish(new OrderCreatedIntegrationEvent
    {
        OrderId = order.Id,
        CustomerId = order.CustomerId,
        Items = order.Items.Select(...).ToList(),
        TotalAmount = order.TotalAmount
    }, cancellationToken);

    return Result<Guid>.Success(order.Id);
}
```

## Timeout Handling

Prevent saga from waiting forever if a service doesn't respond.

```csharp
During(ReservingInventory,
    When(InventoryReserved)
        .Then(context =>
        {
            // Cancel timeout
            if (context.Saga.TimeoutTokenId.HasValue)
                context.CancelTimeout(context.Saga.TimeoutTokenId.Value);
        })
        .TransitionTo(...),

    When(InventoryReserved.Timeout(TimeSpan.FromMinutes(5)))
        .Then(context => Console.WriteLine("Inventory reservation timed out!"))
        .TransitionTo(Failed)
        .Finalize()
);
```

## Monitoring Saga State

Query saga state from database for debugging/monitoring:

```sql
SELECT
    "CorrelationId" AS OrderId,
    "CurrentState",
    "InventoryReserved",
    "RouteCreated",
    "PaymentCharged"
FROM "OrderFulfillmentState"
WHERE "CurrentState" NOT IN ('Completed', 'Failed');
```

## Testing Sagas

### Unit Test: Happy Path

```csharp
[Fact]
public async Task Saga_WhenAllStepsSucceed_ShouldComplete()
{
    // Arrange
    var harness = new InMemoryTestHarness();
    var saga = harness.Saga<OrderFulfillmentState, OrderFulfillmentSaga>();

    await harness.Start();

    var orderId = Guid.NewGuid();

    try
    {
        // Act: Publish initial event
        await harness.InputQueueSendEndpoint.Send(new OrderCreatedIntegrationEvent
        {
            OrderId = orderId,
            CustomerId = "CUST123",
            Items = new List<OrderLineItem> { /* ... */ },
            TotalAmount = 100.00m
        });

        // Simulate successful responses
        await harness.InputQueueSendEndpoint.Send(new InventoryReservedEvent(orderId));
        await harness.InputQueueSendEndpoint.Send(new RouteCreatedEvent(orderId, Guid.NewGuid()));
        await harness.InputQueueSendEndpoint.Send(new PaymentChargedEvent(orderId, "TXN123"));

        // Assert
        Assert.True(await saga.Completed.Any(x => x.CorrelationId == orderId));
    }
    finally
    {
        await harness.Stop();
    }
}
```

### Unit Test: Compensation Path

```csharp
[Fact]
public async Task Saga_WhenPaymentFails_ShouldCompensate()
{
    // Similar setup...

    // Act
    await harness.InputQueueSendEndpoint.Send(new OrderCreatedIntegrationEvent { /* ... */ });
    await harness.InputQueueSendEndpoint.Send(new InventoryReservedEvent(orderId));
    await harness.InputQueueSendEndpoint.Send(new RouteCreatedEvent(orderId, Guid.NewGuid()));

    // Payment FAILS
    await harness.InputQueueSendEndpoint.Send(new PaymentFailedEvent(orderId, "Card declined"));

    // Assert: Compensation commands were sent
    Assert.True(await harness.Sent.Any<CancelRouteCommand>());
    Assert.True(await harness.Sent.Any<ReleaseInventoryCommand>());
}
```

## Best Practices

### ✅ DO:

- Keep saga state minimal (only IDs and flags)
- Use pessimistic locking to prevent race conditions
- Implement timeouts for every waiting state
- Log state transitions for debugging
- Make compensation idempotent (can be called multiple times)

### ❌ DON'T:

- Store large objects in saga state (use IDs instead)
- Make synchronous calls from saga (use events only)
- Forget to finalize saga (causes memory/DB bloat)
- Assume services will respond instantly (always have timeouts)

## Common Patterns

### Pattern 1: Saga Correlation

Always correlate by business ID (OrderId), not internal Saga ID.

### Pattern 2: Idempotent Compensation

Compensating transactions must check if action was actually done:

```csharp
When(CompensatingInventory)
    .If(context => context.Saga.InventoryReserved, // Only release if it was reserved
        binder => binder.Send(...)
    )
```

### Pattern 3: Saga Versioning

When updating saga logic, version the state:

```csharp
public class OrderFulfillmentStateV2 : OrderFulfillmentState
{
    public int Version { get; set; } = 2;
    public DateTime? ShipmentDispatchedAt { get; set; } // New field
}
```

## Troubleshooting

**Issue:** Saga stuck in intermediate state
**Solution:** Check service logs for errors, manually publish completion event if needed

**Issue:** Compensation not triggering
**Solution:** Ensure flags (InventoryReserved, etc.) are set correctly before compensation

**Issue:** Duplicate saga instances
**Solution:** Check CorrelationId is set correctly, use pessimistic locking
