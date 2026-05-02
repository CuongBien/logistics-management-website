using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class OutboundOrderLine : Entity<Guid>
{
    public Guid OutboundOrderId { get; private set; }
    public string SkuCode { get; private set; } = default!;
    public int RequestedQty { get; private set; }
    public string Uom { get; private set; } = default!;

    public OutboundOrder Order { get; private set; } = default!;

    private OutboundOrderLine()
    {
    }

    public OutboundOrderLine(Guid outboundOrderId, string skuCode, int requestedQty, string? uom)
    {
        if (string.IsNullOrWhiteSpace(skuCode))
        {
            throw new ArgumentException("SKU code is required.", nameof(skuCode));
        }

        if (requestedQty <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(requestedQty), "Requested quantity must be greater than zero.");
        }

        Id = Guid.NewGuid();
        OutboundOrderId = outboundOrderId;
        SkuCode = skuCode.Trim();
        RequestedQty = requestedQty;
        Uom = string.IsNullOrWhiteSpace(uom) ? "EA" : uom.Trim();
    }
}
