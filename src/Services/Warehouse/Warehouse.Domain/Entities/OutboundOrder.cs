using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum OutboundOrderStatus
{
    Pending = 0,
    Picking = 1,
    Packed = 2,
    Shipped = 3,
    Cancelled = 4
}

public class OutboundOrder : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid OrderId { get; private set; }
    public OutboundOrderStatus Status { get; private set; }
    public DateTime? PlannedShipAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // EF Core
    private OutboundOrder() { }

    public OutboundOrder(Guid orderId, string tenantId, string customerId, Guid warehouseId, DateTime? plannedShipAt)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = warehouseId;
        PlannedShipAt = plannedShipAt;
        CreatedAt = DateTime.UtcNow;
        Status = OutboundOrderStatus.Pending;
    }

    public void UpdateStatus(OutboundOrderStatus newStatus)
    {
        // Add valid state transitions later in W2
        Status = newStatus;
    }
}
