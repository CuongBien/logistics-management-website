using Logistics.Core;

namespace Ordering.Domain.Events;

public record OrderDiscrepancyDetectedDomainEvent(
    Guid OrderId,
    string WarehouseId
) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
