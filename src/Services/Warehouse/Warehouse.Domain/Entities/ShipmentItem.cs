using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class ShipmentItem : Entity<Guid>
{
    public Guid ShipmentId { get; private set; }
    public Guid OutboundLineId { get; private set; }
    public int Quantity { get; private set; }

    private ShipmentItem() { }

    internal ShipmentItem(Guid shipmentId, Guid outboundLineId, int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than 0");

        Id = Guid.NewGuid();
        ShipmentId = shipmentId;
        OutboundLineId = outboundLineId;
        Quantity = quantity;
    }
    
    internal void AddQuantity(int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity to add must be positive");
            
        Quantity += quantity;
    }
}
