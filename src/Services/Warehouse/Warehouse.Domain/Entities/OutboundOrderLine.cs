using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class OutboundOrderLine : Entity<Guid>
{
    public Guid OutboundOrderId { get; private set; }
    public string SkuCode { get; private set; }
    public string Uom { get; private set; }
    
    public int RequestedQty { get; private set; }
    public int ReservedQty { get; private set; }
    public int PickedQty { get; private set; }
    public int PackedQty { get; private set; }
    public int ShippedQty { get; private set; }

    private OutboundOrderLine() { }

    internal OutboundOrderLine(Guid outboundOrderId, string skuCode, string uom, int requestedQty)
    {
        if (requestedQty <= 0)
            throw new ArgumentException("Requested quantity must be greater than 0");

        Id = Guid.NewGuid();
        OutboundOrderId = outboundOrderId;
        SkuCode = skuCode;
        Uom = uom;
        RequestedQty = requestedQty;
        
        ReservedQty = 0;
        PickedQty = 0;
        PackedQty = 0;
        ShippedQty = 0;
    }

    public void AddReservedQty(int qty)
    {
        if (qty <= 0) throw new ArgumentException("Qty must be positive");
        if (ReservedQty + qty > RequestedQty)
            throw new InvalidOperationException("Reserved quantity cannot exceed requested quantity");
        ReservedQty += qty;
    }

    public void AddPickedQty(int qty)
    {
        if (qty <= 0) throw new ArgumentException("Qty must be positive");
        if (PickedQty + qty > ReservedQty)
            throw new InvalidOperationException("Picked quantity cannot exceed reserved quantity");
        PickedQty += qty;
    }

    public void AddPackedQty(int qty)
    {
        if (qty <= 0) throw new ArgumentException("Qty must be positive");
        if (PackedQty + qty > PickedQty)
            throw new InvalidOperationException("Packed quantity cannot exceed picked quantity");
        PackedQty += qty;
    }

    public void AddShippedQty(int qty)
    {
        if (qty <= 0) throw new ArgumentException("Qty must be positive");
        if (ShippedQty + qty > PackedQty)
            throw new InvalidOperationException("Shipped quantity cannot exceed packed quantity");
        ShippedQty += qty;
    }
}
