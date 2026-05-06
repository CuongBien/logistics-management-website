using Logistics.Core;

namespace Ordering.Domain.Entities;

public class OrderStatusHistory : Entity<Guid>
{
    public Guid OrderId { get; private set; }
    public string TenantId { get; private set; } = default!;
    public string StatusFrom { get; private set; } = default!;
    public string StatusTo { get; private set; } = default!;
    public DateTime ChangedAtUtc { get; private set; }
    public string Source { get; private set; } = default!;
    public string? Reason { get; private set; }
    public string? ChangedByOperatorId { get; private set; }
    public string? CorrelationId { get; private set; }

    public Order Order { get; private set; } = default!;

    private OrderStatusHistory() { }

    public OrderStatusHistory(
        Guid orderId,
        string tenantId,
        string statusFrom,
        string statusTo,
        DateTime changedAtUtc,
        string source,
        string? reason,
        string? changedByOperatorId,
        string? correlationId)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        TenantId = tenantId;
        StatusFrom = statusFrom;
        StatusTo = statusTo;
        ChangedAtUtc = changedAtUtc;
        Source = source;
        Reason = reason;
        ChangedByOperatorId = changedByOperatorId;
        CorrelationId = correlationId;
    }

    public OrderStatusHistory(Guid orderId, string tenantId, string statusFrom, string statusTo, DateTime changedAtUtc, string source)
        : this(orderId, tenantId, statusFrom, statusTo, changedAtUtc, source, null, null, null)
    {
    }
}
