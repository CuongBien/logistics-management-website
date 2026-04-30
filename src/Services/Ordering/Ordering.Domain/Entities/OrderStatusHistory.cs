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

    public Order Order { get; private set; } = default!;

    private OrderStatusHistory() { }

    public OrderStatusHistory(Guid orderId, string tenantId, string statusFrom, string statusTo, DateTime changedAtUtc, string source)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        TenantId = tenantId;
        StatusFrom = statusFrom;
        StatusTo = statusTo;
        ChangedAtUtc = changedAtUtc;
        Source = source;
    }
}
