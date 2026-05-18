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

    /// <summary>
    /// Resets all progress counters for the next transit leg.
    /// RequestedQty is preserved as the original customer order quantity (Single Source of Truth).
    /// Reserved/Picked/Packed are set to the actual quantity received at the hub.
    /// ShippedQty is reset to 0 so the next-leg dispatch can calculate correctly.
    /// </summary>
    /// <param name="actualReceivedQty">The quantity physically received at the transit hub.</param>
    public void ResetForNextTransitLeg(int actualReceivedQty)
    {
        if (actualReceivedQty < 0) throw new ArgumentException("Received quantity cannot be negative");

        // Do NOT modify RequestedQty — it preserves the original order intent.
        // Set all progress counters to match what is physically available at this hub.
        ReservedQty = actualReceivedQty;
        PickedQty = actualReceivedQty;
        PackedQty = actualReceivedQty;
        ShippedQty = 0;
    }
}
