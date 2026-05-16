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
        bool allowPartial = true)
    {
        Id = orderId;
        OrderId = orderId;
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = warehouseId;
        OrderNo = orderNo;
        DestinationAddress = destinationAddress;
        DestinationCity = destinationCity;
        Destination = destinationCity ?? destinationAddress; // Fallback
        Priority = priority;
        AllowPartial = allowPartial;
        Status = OutboundOrderStatus.Draft;
        CreatedAt = DateTime.UtcNow;
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
        bool allowPartial = true)
    {
        return new OutboundOrder(orderId, tenantId, customerId, warehouseId, orderNo, destinationAddress, destinationCity, priority, allowPartial);
    }

    public void UpdateStatus(OutboundOrderStatus newStatus)
    {
        Status = newStatus;
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
