using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum OutboundOrderStatus
{
    Draft = 0
}

public class OutboundOrder : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid OrderId { get; private set; }
    public Guid DestinationWarehouseId { get; private set; }
    public OutboundOrderStatus Status { get; private set; }

    private readonly List<OutboundOrderLine> _lines = new();
    public IReadOnlyCollection<OutboundOrderLine> Lines => _lines.AsReadOnly();

    private OutboundOrder()
    {
    }

    public OutboundOrder(
        Guid orderId,
        Guid destinationWarehouseId,
        string tenantId,
        string customerId,
        IReadOnlyCollection<(string SkuCode, int RequestedQty, string? Uom)> lineSpecs)
    {
        ArgumentNullException.ThrowIfNull(lineSpecs);
        if (lineSpecs.Count == 0)
        {
            throw new ArgumentException("At least one outbound line is required.", nameof(lineSpecs));
        }

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(tenantId));
        }

        if (string.IsNullOrWhiteSpace(customerId))
        {
            throw new ArgumentException("CustomerId is required.", nameof(customerId));
        }

        Id = Guid.NewGuid();
        OrderId = orderId;
        DestinationWarehouseId = destinationWarehouseId;
        TenantId = tenantId.Trim();
        CustomerId = customerId.Trim();
        Status = OutboundOrderStatus.Draft;

        foreach (var spec in lineSpecs)
        {
            if (string.IsNullOrWhiteSpace(spec.SkuCode))
            {
                throw new ArgumentException("SKU code is required for each line.", nameof(lineSpecs));
            }

            if (spec.RequestedQty <= 0)
            {
                throw new ArgumentOutOfRangeException(nameof(lineSpecs), "Requested quantity must be greater than zero.");
            }

            _lines.Add(new OutboundOrderLine(Id, spec.SkuCode.Trim(), spec.RequestedQty, spec.Uom));
        }
    }
}
