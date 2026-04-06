using Logistics.Core;

namespace Ordering.Domain.Entities;

public class OrderState : Entity<Guid>
{
    public Guid CorrelationId { get; private set; }
    public string CurrentState { get; private set; } = default!;
    public DateTime CreatedAt { get; private set; }
    public int Version { get; private set; }

    // EF Core
    private OrderState() { }

    public OrderState(Guid correlationId, string currentState)
    {
        Id = Guid.NewGuid();
        CorrelationId = correlationId;
        CurrentState = currentState;
        CreatedAt = DateTime.UtcNow;
        Version = 1;
    }

    public void UpdateState(string newState)
    {
        CurrentState = newState;
        Version++;
    }
}