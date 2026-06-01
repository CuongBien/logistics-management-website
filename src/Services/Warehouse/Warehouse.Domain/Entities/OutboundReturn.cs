using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class OutboundReturn : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid ShipmentId { get; private set; }
    public string OrderNo { get; private set; } = default!;
    public string Sku { get; private set; } = default!;
    public int ReturnedQty { get; private set; }
    public ReturnCondition Condition { get; private set; }
    public ReturnDisposition Disposition { get; private set; }
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ProcessedAt { get; private set; }
    public string? ProcessedBy { get; private set; }

    private OutboundReturn() { }

    public OutboundReturn(
        string tenantId,
        string customerId,
        Guid warehouseId,
        Guid shipmentId,
        string orderNo,
        string sku,
        int returnedQty,
        ReturnCondition condition,
        string? notes = null)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = warehouseId;
        ShipmentId = shipmentId;
        OrderNo = orderNo;
        Sku = sku;
        ReturnedQty = returnedQty;
        Condition = condition;
        Disposition = ReturnDisposition.Pending;
        Notes = notes;
        CreatedAt = DateTime.UtcNow;
    }

    public void Process(ReturnDisposition disposition, string operatorId, string? notes = null)
    {
        if (Disposition != ReturnDisposition.Pending)
            throw new InvalidOperationException($"Cannot process return from status {Disposition}");

        Disposition = disposition;
        ProcessedBy = operatorId;
        ProcessedAt = DateTime.UtcNow;
        if (notes != null) Notes = notes;
    }
}
