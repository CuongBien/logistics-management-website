using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class ShipmentOrder : Entity<Guid>
{
    public Guid ShipmentId { get; private set; }
    public Guid OutboundOrderId { get; private set; }

    private ShipmentOrder() { }

    internal ShipmentOrder(Guid shipmentId, Guid outboundOrderId)
    {
        Id = Guid.NewGuid();
        ShipmentId = shipmentId;
        OutboundOrderId = outboundOrderId;
    }
}
