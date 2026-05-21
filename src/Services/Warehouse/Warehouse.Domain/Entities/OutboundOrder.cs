using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public enum OutboundOrderStatus
{
    Draft = 1,
    PendingAllocation = 2,
    PartiallyAllocated = 3,
    Allocated = 4,
    Picking = 5,
    PartiallyPicked = 6,
    Picked = 7,
    Packing = 8,
    Packed = 9,
    Loaded = 10,
    Shipped = 11,
    Delivered = 12,
    Cancelled = 13,
    Failed = 14
}

public class OutboundOrder : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public string? PartnerId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public Guid OrderId { get; private set; } // OMS Order ID Reference
    public string OrderNo { get; private set; } = default!; // Human readable No
    
    public OutboundOrderStatus Status { get; private set; }
    public int Priority { get; private set; }
    public bool AllowPartial { get; private set; }
    public DateTime? PlannedShipAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Destination Details
    public string? Destination { get; private set; } // Keep for backward compatibility/legacy logic
    public string? DestinationAddress { get; private set; }
    public string? DestinationCity { get; private set; }

    // GPS Coordinates
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }

    // Physical constraints
    public decimal Weight { get; private set; }
    public decimal Volume { get; private set; }

    public string? CreatedByOperatorId { get; private set; }

    private readonly List<OutboundOrderLine> _lines = new();
    public virtual IReadOnlyCollection<OutboundOrderLine> Lines => _lines.AsReadOnly();

    // EF Core
    private OutboundOrder() { }

    public OutboundOrder(
        Guid orderId, 
        string tenantId, 
        string customerId, 
        Guid warehouseId, 
        string orderNo,
        string? destinationAddress = null,
        string? destinationCity = null,
        int priority = 0,
        bool allowPartial = true,
        string? partnerId = null,
        double? latitude = null,
        double? longitude = null,
        decimal weight = 0,
        decimal volume = 0,
        string? createdByOperatorId = null)
    {
        Id = orderId;
        OrderId = orderId;
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = warehouseId;
        OrderNo = orderNo;
        DestinationAddress = destinationAddress;
        DestinationCity = destinationCity;
        PartnerId = partnerId;
        Destination = destinationCity ?? destinationAddress; // Fallback
        Priority = priority;
        AllowPartial = allowPartial;
        Latitude = latitude;
        Longitude = longitude;
        Weight = weight;
        Volume = volume <= 0 ? weight * 0.003m : volume; // Default estimate CBM from weight
        Status = OutboundOrderStatus.Draft;
        CreatedAt = DateTime.UtcNow;
        CreatedByOperatorId = createdByOperatorId;
    }

    public static OutboundOrder Create(
        string tenantId,
        string customerId,
        Guid warehouseId,
        Guid orderId,
        string orderNo,
        string? destinationAddress = null,
        string? destinationCity = null,
        int priority = 0,
        bool allowPartial = true,
        string? partnerId = null,
        double? latitude = null,
        double? longitude = null,
        decimal weight = 0,
        decimal volume = 0,
        string? createdByOperatorId = null)
    {
        return new OutboundOrder(orderId, tenantId, customerId, warehouseId, orderNo, destinationAddress, destinationCity, priority, allowPartial, partnerId, latitude, longitude, weight, volume, createdByOperatorId);
    }

    // BUG-13 FIX: State machine guard — defines valid forward transitions.
    // Prevents impossible jumps like Delivered→Draft or Cancelled→Shipped.
    private static readonly Dictionary<OutboundOrderStatus, HashSet<OutboundOrderStatus>> _allowedTransitions = new()
    {
        { OutboundOrderStatus.Draft, new() { OutboundOrderStatus.PendingAllocation, OutboundOrderStatus.Allocated, OutboundOrderStatus.PartiallyAllocated, OutboundOrderStatus.Cancelled, OutboundOrderStatus.Shipped } },
        { OutboundOrderStatus.PendingAllocation, new() { OutboundOrderStatus.Allocated, OutboundOrderStatus.PartiallyAllocated, OutboundOrderStatus.Cancelled, OutboundOrderStatus.Failed } },
        { OutboundOrderStatus.PartiallyAllocated, new() { OutboundOrderStatus.Allocated, OutboundOrderStatus.Picking, OutboundOrderStatus.Cancelled, OutboundOrderStatus.Failed } },
        { OutboundOrderStatus.Allocated, new() { OutboundOrderStatus.Picking, OutboundOrderStatus.Cancelled } },
        { OutboundOrderStatus.Picking, new() { OutboundOrderStatus.PartiallyPicked, OutboundOrderStatus.Picked, OutboundOrderStatus.Cancelled, OutboundOrderStatus.Failed } },
        { OutboundOrderStatus.PartiallyPicked, new() { OutboundOrderStatus.Picked, OutboundOrderStatus.Packed, OutboundOrderStatus.Cancelled, OutboundOrderStatus.Failed } },
        { OutboundOrderStatus.Picked, new() { OutboundOrderStatus.Packing, OutboundOrderStatus.Packed, OutboundOrderStatus.Cancelled } },
        { OutboundOrderStatus.Packing, new() { OutboundOrderStatus.Packed, OutboundOrderStatus.Cancelled, OutboundOrderStatus.Failed } },
        { OutboundOrderStatus.Packed, new() { OutboundOrderStatus.Loaded, OutboundOrderStatus.Shipped, OutboundOrderStatus.Cancelled } },
        { OutboundOrderStatus.Loaded, new() { OutboundOrderStatus.Shipped, OutboundOrderStatus.Packed, OutboundOrderStatus.Cancelled } },
        { OutboundOrderStatus.Shipped, new() { OutboundOrderStatus.Delivered, OutboundOrderStatus.Failed, OutboundOrderStatus.Packed } }, // Packed = transit re-receive
        { OutboundOrderStatus.Delivered, new() { } }, // Terminal
        { OutboundOrderStatus.Cancelled, new() { } }, // Terminal
        { OutboundOrderStatus.Failed, new() { OutboundOrderStatus.Draft } } // Allow retry from Failed
    };

    public void UpdateStatus(OutboundOrderStatus newStatus)
    {
        if (Status == newStatus) return; // Idempotent

        if (_allowedTransitions.TryGetValue(Status, out var allowed) && allowed.Contains(newStatus))
        {
            Status = newStatus;
        }
        else
        {
            throw new InvalidOperationException(
                $"Invalid status transition: {Status} → {newStatus}. Allowed transitions from {Status}: [{string.Join(", ", _allowedTransitions.GetValueOrDefault(Status) ?? new())}]");
        }
    }

    public void UpdateWarehouse(Guid newWarehouseId)
    {
        WarehouseId = newWarehouseId;
    }

    public void AddLine(string sku, int requestedQty, string uom)
    {
        if (Status != OutboundOrderStatus.Draft)
            throw new InvalidOperationException("Can only add lines in Draft status.");

        if (_lines.Any(x => x.Sku == sku))
            throw new InvalidOperationException($"SKU {sku} already exists in this order.");

        _lines.Add(OutboundOrderLine.Create(Id, sku, requestedQty, uom));
    }
}
