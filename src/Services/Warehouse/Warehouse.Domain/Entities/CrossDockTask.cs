using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class CrossDockTask
{
    public Guid Id { get; private set; }
    public string TenantId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid ReceiptId { get; private set; }
    public Guid OutboundOrderId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int ExpectedQty { get; private set; }
    public int MovedQty { get; private set; }
    public Guid SourceBinId { get; private set; }
    public Guid DestinationBinId { get; private set; }
    public CrossDockTaskStatus Status { get; private set; }
    public string? AssignedOperatorId { get; private set; }
    
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // EF constructor
    protected CrossDockTask() { }

    public CrossDockTask(
        string tenantId,
        Guid warehouseId,
        Guid receiptId,
        Guid outboundOrderId,
        string sku,
        int expectedQty,
        Guid sourceBinId,
        Guid destinationBinId)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        WarehouseId = warehouseId;
        ReceiptId = receiptId;
        OutboundOrderId = outboundOrderId;
        Sku = sku;
        ExpectedQty = expectedQty;
        MovedQty = 0;
        SourceBinId = sourceBinId;
        DestinationBinId = destinationBinId;
        Status = CrossDockTaskStatus.Pending;
        CreatedAt = DateTime.UtcNow;
    }

    public void AssignTo(string operatorId)
    {
        AssignedOperatorId = operatorId;
        if (Status == CrossDockTaskStatus.Pending)
        {
            Status = CrossDockTaskStatus.InProgress;
        }
    }

    public void Complete(int movedQty)
    {
        MovedQty = movedQty;
        Status = CrossDockTaskStatus.Completed;
        CompletedAt = DateTime.UtcNow;
    }
}
