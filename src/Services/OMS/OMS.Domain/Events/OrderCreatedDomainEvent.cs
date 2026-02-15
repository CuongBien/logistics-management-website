using BuildingBlocks.Domain;

namespace OMS.Domain.Events;

public record OrderCreatedDomainEvent(Guid OrderId, string CustomerId, decimal TotalAmount) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
