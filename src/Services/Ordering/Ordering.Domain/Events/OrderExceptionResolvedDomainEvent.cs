using Logistics.Core;

namespace Ordering.Domain.Events;

public record OrderExceptionResolvedDomainEvent(
    Guid OrderId,
    string Strategy
) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
