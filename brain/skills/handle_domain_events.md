# Skill: Handle Domain Events (Event-Driven Architecture)

## Overview

Domain Events là cơ chế để các Aggregate giao tiếp với nhau KHÔNG trực tiếp (loose coupling). Events phát sinh từ Domain Layer nhưng được xử lý ở Application Layer.

**Trigger:** Use this skill when implementing side effects within the same service (e.g. Order Created -> Publish Event) or decoupling logic.

## Phân Biệt: Domain Events vs Integration Events

| Aspect        | Domain Event              | Integration Event                  |
| ------------- | ------------------------- | ---------------------------------- |
| **Scope**     | Nội bộ Bounded Context    | Giữa các Bounded Contexts/Services |
| **Purpose**   | Notify trong cùng service | Notify các services khác           |
| **Transport** | In-memory (MediatR)       | Message Bus (RabbitMQ/Kafka)       |
| **Example**   | `OrderCreatedDomainEvent` | `OrderCreatedIntegrationEvent`     |

## Implementation Strategy

### Step 1: Define Domain Event (in Domain Layer)

```csharp
namespace Domain.Events;

/// <summary>
/// Raised when an Order is successfully created.
/// This is a DOMAIN event (internal to OMS service).
/// </summary>
public sealed record OrderCreatedDomainEvent(
    Guid OrderId,
    string CustomerId,
    decimal TotalAmount
) : IDomainEvent;

// Marker interface
public interface IDomainEvent : INotification
{
    Guid EventId => Guid.NewGuid();
    DateTime OccurredOn => DateTime.UtcNow;
}
```

### Step 2: Raise Event from Entity (in Domain Layer)

```csharp
namespace Domain.Entities;

public class Order : AggregateRoot
{
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }

    // Domain Events collection (not persisted)
    private readonly List<IDomainEvent> _domainEvents = new();
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public static Order Create(string customerId, List<OrderItem> items)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            Items = items,
            Status = OrderStatus.New
        };

        // Raise domain event
        order.RaiseDomainEvent(new OrderCreatedDomainEvent(
            order.Id,
            customerId,
            order.TotalAmount
        ));

        return order;
    }

    private void RaiseDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

### Step 3: Dispatch Events After SaveChanges (in Infrastructure Layer)

```csharp
namespace Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly IPublisher _publisher; // MediatR

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // 1. Save changes to DB first
        var result = await base.SaveChangesAsync(cancellationToken);

        // 2. Dispatch domain events (after transaction succeeds)
        await DispatchDomainEventsAsync(cancellationToken);

        return result;
    }

    private async Task DispatchDomainEventsAsync(CancellationToken cancellationToken)
    {
        var entities = ChangeTracker.Entries<AggregateRoot>()
            .Where(e => e.Entity.DomainEvents.Any())
            .Select(e => e.Entity)
            .ToList();

        var domainEvents = entities
            .SelectMany(e => e.DomainEvents)
            .ToList();

        // Clear events before publishing (prevent re-processing)
        entities.ForEach(e => e.ClearDomainEvents());

        // Publish all events
        foreach (var domainEvent in domainEvents)
        {
            await _publisher.Publish(domainEvent, cancellationToken);
        }
    }
}
```

### Step 4: Handle Domain Event (in Application Layer)

```csharp
namespace Application.Features.Orders.EventHandlers;

/// <summary>
/// When an Order is created, notify Inventory service to reserve stock.
/// </summary>
internal sealed class OrderCreatedDomainEventHandler(
    IPublishEndpoint publishEndpoint, // MassTransit (for Integration Events)
    ILogger<OrderCreatedDomainEventHandler> logger
) : INotificationHandler<OrderCreatedDomainEvent>
{
    public async Task Handle(OrderCreatedDomainEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Order {OrderId} created. Publishing integration event...", notification.OrderId);

        // Convert Domain Event → Integration Event
        var integrationEvent = new OrderCreatedIntegrationEvent(
            notification.OrderId,
            notification.CustomerId,
            notification.TotalAmount,
            DateTime.UtcNow
        );

        // Publish to RabbitMQ/Kafka (using Outbox Pattern implicitly via MassTransit)
        await publishEndpoint.Publish(integrationEvent, cancellationToken);

        logger.LogInformation("Integration event published for Order {OrderId}", notification.OrderId);
    }
}
```

## Critical Rules

### Rule 1: Domain Events Stay in Domain

- ❌ **BAD:** `await _messageBus.Publish(...)` inside Domain Entity
- ✅ **GOOD:** `RaiseDomainEvent(new OrderCreated(...))` then Infrastructure dispatches it

### Rule 2: Events Are Immutable

- Always use `sealed record` for events
- No setters, only constructor/init

### Rule 3: One Handler Per Event (Usually)

- Avoid multiple handlers for same event unless truly needed
- Keep handlers focused (Single Responsibility)

### Rule 4: Idempotency

- Event handlers MUST be idempotent (can be called multiple times safely)
- Use `InboxState` pattern to track processed events

## Testing Domain Events

```csharp
[Fact]
public void Create_ShouldRaiseDomainEvent()
{
    // Arrange
    var customerId = "CUST123";
    var items = new List<OrderItem> { /* ... */ };

    // Act
    var order = Order.Create(customerId, items);

    // Assert
    order.DomainEvents.Should().HaveCount(1);
    order.DomainEvents.First().Should().BeOfType<OrderCreatedDomainEvent>();

    var domainEvent = (OrderCreatedDomainEvent)order.DomainEvents.First();
    domainEvent.OrderId.Should().Be(order.Id);
    domainEvent.CustomerId.Should().Be(customerId);
}
```

## Common Pitfalls

❌ **DON'T:**

- Publish Integration Events directly from Domain
- Use async/await in Domain Event raising (keep it synchronous)
- Forget to clear events after dispatch (will cause duplicates)

✅ **DO:**

- Keep Domain Events lightweight (just data, no logic)
- Use Integration Events for cross-service communication
- Always test that events are raised correctly
