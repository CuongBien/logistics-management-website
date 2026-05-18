using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class OutboundOrderLine : Entity<Guid>
{
    public Guid OutboundOrderId { get; private set; }
    public string Sku { get; private set; } = default!;
    public string Uom { get; private set; } = default!;
    
    public int RequestedQty { get; private set; }
    public int ReservedQty { get; private set; }
    public int PickedQty { get; private set; }
    public int PackedQty { get; private set; }
    public int ShippedQty { get; private set; }

    // Navigation
    public virtual OutboundOrder OutboundOrder { get; private set; } = default!;

    // EF Core
    private OutboundOrderLine() { }

    public static OutboundOrderLine Create(Guid orderId, string sku, int requestedQty, string uom)
    {
        if (requestedQty <= 0) throw new ArgumentException("Quantity must be positive");

        return new OutboundOrderLine
        {
            Id = Guid.NewGuid(),
            OutboundOrderId = orderId,
            Sku = sku,
            Uom = uom,
            RequestedQty = requestedQty,
            ReservedQty = 0,
            PickedQty = 0,
            PackedQty = 0,
            ShippedQty = 0
        };
    }

    public void UpdateReserved(int qty) 
    {
        if (qty > RequestedQty) throw new InvalidOperationException("Reserved quantity cannot exceed requested");
        ReservedQty = qty;
    }

    public void UpdatePicked(int qty)
    {
        if (qty > ReservedQty) throw new InvalidOperationException("Picked quantity cannot exceed reserved");
        PickedQty = qty;
    }

    public void UpdatePacked(int qty)
    {
        if (qty > PickedQty) throw new InvalidOperationException("Packed quantity cannot exceed picked");
        PackedQty = qty;
    }

    public void UpdateShipped(int qty)
    {
        if (qty > PackedQty) throw new InvalidOperationException("Shipped quantity cannot exceed packed");
        ShippedQty = qty;
    }

    public void UpdateRequestedQuantity(int qty)
    {
        if (qty < 0) throw new ArgumentException("Quantity cannot be negative");
        RequestedQty = qty;
    }
}
