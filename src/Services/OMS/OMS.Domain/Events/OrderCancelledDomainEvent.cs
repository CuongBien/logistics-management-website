using BuildingBlocks.Domain;

namespace OMS.Domain.Events;

public record OrderCancelledDomainEvent(Guid OrderId) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
