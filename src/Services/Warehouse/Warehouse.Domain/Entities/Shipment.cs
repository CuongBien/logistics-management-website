using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public enum ShipmentStatus
{
    Planned = 1,
    Loading = 2,
    ReadyToShip = 3,
    Shipped = 4,
    InTransit = 5,
    Delivered = 6,
    Failed = 7,
    Returned = 8,
    Cancelled = 9
}

public class Shipment : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public string ShipmentNo { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public DestinationType DestinationType { get; private set; }
    public string DestinationId { get; private set; } = default!; // This is our DestinationKey

    public string? Carrier { get; private set; }
    public string? RouteId { get; private set; }
    public string? TrackingNo { get; private set; }
    public ShipmentStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ShippedAt { get; private set; }

    private readonly List<ShipmentItem> _items = new();
    public virtual IReadOnlyCollection<ShipmentItem> Items => _items.AsReadOnly();

    private readonly List<ShipmentOrder> _orders = new();
    public virtual IReadOnlyCollection<ShipmentOrder> Orders => _orders.AsReadOnly();

    private Shipment() { }

    public Shipment(
        string tenantId,
        string customerId,
        string shipmentNo,
        Guid warehouseId,
        DestinationType destinationType,
        string destinationId,
        string? routeId = null)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        CustomerId = customerId;
        ShipmentNo = shipmentNo;
        WarehouseId = warehouseId;
        DestinationType = destinationType;
        DestinationId = destinationId;
        RouteId = routeId;
        Status = ShipmentStatus.Planned;
        CreatedAt = DateTime.UtcNow;
    }

    public void AssignCarrier(string carrier, string? trackingNo = null, string? routeId = null)
    {
        if (Status >= ShipmentStatus.Shipped && Status <= ShipmentStatus.Delivered)
            throw new InvalidOperationException("Cannot assign carrier after shipment has departed.");

        Carrier = carrier;
        TrackingNo = trackingNo;
        if (!string.IsNullOrEmpty(routeId)) RouteId = routeId;
    }

    public void MarkLoading()
    {
        if (Status == ShipmentStatus.Planned)
            Status = ShipmentStatus.Loading;
    }

    public void MarkReadyToShip()
    {
        if (Status != ShipmentStatus.Loading && Status != ShipmentStatus.Planned)
            throw new InvalidOperationException("Shipment must be in Planned or Loading state to mark as ReadyToShip.");

        Status = ShipmentStatus.ReadyToShip;
    }

    public void MarkShipped()
    {
        if (Status != ShipmentStatus.ReadyToShip && Status != ShipmentStatus.Loading && Status != ShipmentStatus.Planned)
            throw new InvalidOperationException("Invalid state transition for shipping.");

        Status = ShipmentStatus.Shipped;
        ShippedAt = DateTime.UtcNow;
    }

    public void Dispatch() => MarkShipped();

    public void Deliver()
    {
        Status = ShipmentStatus.Delivered;
    }

    public void AddOrder(Guid outboundOrderId)
    {
        if (_orders.Any(x => x.OutboundOrderId == outboundOrderId))
            return;

        _orders.Add(new ShipmentOrder(Id, outboundOrderId));
    }

    public void AddItem(Guid outboundOrderLineId, int quantity)
    {
        var existingItem = _items.FirstOrDefault(x => x.OutboundOrderLineId == outboundOrderLineId);
        if (existingItem != null)
        {
            existingItem.AddQuantity(quantity);
        }
        else
        {
            _items.Add(new ShipmentItem(Id, outboundOrderLineId, quantity));
        }
    }
}

public class ShipmentItem : Entity<Guid>
{
    public Guid ShipmentId { get; private set; }
    public Guid OutboundOrderLineId { get; private set; }
    public int Quantity { get; private set; }

    // Navigation
    public virtual Shipment Shipment { get; private set; } = default!;
    public virtual OutboundOrderLine OutboundOrderLine { get; private set; } = default!;

    private ShipmentItem() { }

    internal ShipmentItem(Guid shipmentId, Guid outboundOrderLineId, int quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Quantity must be greater than 0");

        ShipmentId = shipmentId;
        OutboundOrderLineId = outboundOrderLineId;
        Quantity = quantity;
    }

    internal void AddQuantity(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity to add must be positive");
        Quantity += quantity;
    }
}

public class ShipmentOrder : Entity<Guid>
{
    public Guid ShipmentId { get; private set; }
    public Guid OutboundOrderId { get; private set; }

    // Navigation
    public virtual Shipment Shipment { get; private set; } = default!;
    public virtual OutboundOrder OutboundOrder { get; private set; } = default!;

    private ShipmentOrder() { }

    internal ShipmentOrder(Guid shipmentId, Guid outboundOrderId)
    {
        ShipmentId = shipmentId;
        OutboundOrderId = outboundOrderId;
    }
}
