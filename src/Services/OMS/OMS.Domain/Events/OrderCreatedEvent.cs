using BuildingBlocks.Domain;

namespace OMS.Domain.Events;

public record OrderCreatedEvent(Guid OrderId, string CustomerId) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
