using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum OutboundOrderStatus
{
    Draft = 0,
    PendingAllocation = 1,
    PartiallyAllocated = 2,
    Allocated = 3,
    Picking = 4,
    PartiallyPicked = 5,
    Picked = 6,
    Packing = 7,
    Packed = 8,
    PartiallyShipped = 9,
    Shipped = 10,
    Cancelled = 11,
    Failed = 12
}

public class OutboundOrder : Entity<Guid>, IAggregateRoot
{
    public string OrderNo { get; private set; }
    public Guid WarehouseId { get; private set; }
    public OutboundOrderStatus Status { get; private set; }
    public int Priority { get; private set; }
    public bool AllowPartial { get; private set; }
    public DateTime? PlannedShipAt { get; private set; }
    
    // Original Destination details
    public string DestinationAddress { get; private set; }
    public string DestinationCity { get; private set; }

    private readonly List<OutboundOrderLine> _lines = new();
    public IReadOnlyCollection<OutboundOrderLine> Lines => _lines.AsReadOnly();

    private OutboundOrder() { }

    public OutboundOrder(string orderNo, Guid warehouseId, string destinationAddress, string destinationCity, int priority = 0, bool allowPartial = true)
    {
        Id = Guid.NewGuid();
        OrderNo = orderNo;
        WarehouseId = warehouseId;
        DestinationAddress = destinationAddress;
        DestinationCity = destinationCity;
        Priority = priority;
        AllowPartial = allowPartial;
        Status = OutboundOrderStatus.Draft;
    }

    public void AddLine(string skuCode, string uom, int requestedQty)
    {
        if (Status != OutboundOrderStatus.Draft)
            throw new InvalidOperationException("Can only add lines when order is in Draft status.");
            
        var line = new OutboundOrderLine(Id, skuCode, uom, requestedQty);
        _lines.Add(line);
    }
    
    public void ChangeStatus(OutboundOrderStatus newStatus)
    {
        Status = newStatus;
    }
}
