using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class Shipment : Entity<Guid>, IAggregateRoot, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public string ShipmentNo { get; private set; } = default!;
    public Guid WarehouseId { get; private set; } // Source Warehouse
    public DestinationType DestinationType { get; private set; }
    public string DestinationId { get; private set; } = default!;
    public ShipmentStatus Status { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // EF Core
    private Shipment() { }

    public Shipment(string tenantId, string customerId, string shipmentNo, Guid sourceWarehouseId, DestinationType destinationType, string destinationId)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        CustomerId = customerId;
        ShipmentNo = shipmentNo;
        WarehouseId = sourceWarehouseId;
        DestinationType = destinationType;
        DestinationId = destinationId;
        CreatedAt = DateTime.UtcNow;
        Status = ShipmentStatus.Pending;
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void Dispatch()
    {
        if (Status != ShipmentStatus.Pending)
        {
            throw new InvalidOperationException("Shipment is not in a valid state to dispatch.");
        }
        
        Status = ShipmentStatus.Dispatched;
        ShippedAt = DateTime.UtcNow;
    }

    public void Deliver()
    {
        if (Status != ShipmentStatus.Dispatched)
        {
            throw new InvalidOperationException("Shipment is not in a valid state to deliver.");
        }

        Status = ShipmentStatus.Delivered;
    }
}
