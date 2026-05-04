using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum ShipmentStatus
{
    Pending = 0,
    Dispatched = 1,
    Delivered = 2
}

public enum DestinationType
{
    Warehouse = 0,
    Customer = 1,
    Other = 2
}

public class Shipment : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; } // Source Warehouse
    public DestinationType DestinationType { get; private set; }
    public string DestinationId { get; private set; } = default!;
    public ShipmentStatus Status { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // EF Core
    private Shipment() { }

    public Shipment(string tenantId, string customerId, Guid sourceWarehouseId, DestinationType destinationType, string destinationId)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = sourceWarehouseId;
        DestinationType = destinationType;
        DestinationId = destinationId;
        CreatedAt = DateTime.UtcNow;
        Status = ShipmentStatus.Pending;
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
}
