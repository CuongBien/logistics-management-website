using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum ShipmentStatus
{
    Planned = 0,
    ReadyToShip = 1,
    Shipped = 2,
    InTransit = 3,
    Delivered = 4,
    Failed = 5,
    Returned = 6,
    Cancelled = 7
}

public class Shipment : Entity<Guid>, IAggregateRoot
{
    public string ShipmentNo { get; private set; }
    public Guid WarehouseId { get; private set; }
    public string? Carrier { get; private set; }
    public string RouteId { get; private set; }
    public string? TrackingNo { get; private set; }
    public ShipmentStatus Status { get; private set; }
    public DateTime? ShippedAt { get; private set; }
    public string DestinationKey { get; private set; }

    private readonly List<ShipmentItem> _items = new();
    public IReadOnlyCollection<ShipmentItem> Items => _items.AsReadOnly();
    
    private readonly List<ShipmentOrder> _orders = new();
    public IReadOnlyCollection<ShipmentOrder> Orders => _orders.AsReadOnly();

    private Shipment() { }

    public Shipment(string shipmentNo, Guid warehouseId, string routeId, string destinationKey)
    {
        Id = Guid.NewGuid();
        ShipmentNo = shipmentNo;
        WarehouseId = warehouseId;
        RouteId = routeId;
        DestinationKey = destinationKey;
        Status = ShipmentStatus.Planned;
    }

    public void AssignCarrier(string carrier, string? trackingNo = null)
    {
        if (Status == ShipmentStatus.Shipped || Status == ShipmentStatus.InTransit || Status == ShipmentStatus.Delivered)
            throw new InvalidOperationException("Cannot assign carrier after shipment has departed.");

        Carrier = carrier;
        TrackingNo = trackingNo;
    }

    public void MarkReadyToShip()
    {
        if (string.IsNullOrEmpty(Carrier))
            throw new InvalidOperationException("Carrier must be assigned before marking as ReadyToShip.");
            
        Status = ShipmentStatus.ReadyToShip;
    }

    public void MarkShipped()
    {
        if (Status != ShipmentStatus.ReadyToShip)
            throw new InvalidOperationException("Shipment must be ReadyToShip before it can be Shipped.");

        Status = ShipmentStatus.Shipped;
        ShippedAt = DateTime.UtcNow;
    }
    
    public void AddOrder(Guid outboundOrderId)
    {
        if (_orders.Any(x => x.OutboundOrderId == outboundOrderId))
            return; // Idempotent
            
        _orders.Add(new ShipmentOrder(Id, outboundOrderId));
    }
    
    public void AddItem(Guid outboundLineId, int quantity)
    {
        var existingItem = _items.FirstOrDefault(x => x.OutboundLineId == outboundLineId);
        if (existingItem != null)
        {
            existingItem.AddQuantity(quantity);
        }
        else
        {
            _items.Add(new ShipmentItem(Id, outboundLineId, quantity));
        }
    }
}
