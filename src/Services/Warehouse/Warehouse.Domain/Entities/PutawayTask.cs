using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class PutawayTask : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid ReceiptId { get; private set; }
    public string Sku { get; private set; } = default!;
    public string? LotNo { get; private set; }
    public int Quantity { get; private set; }
    
    public Guid SourceBinId { get; private set; }
    public Guid SuggestedBinId { get; private set; }
    public Guid? ActualBinId { get; private set; }
    
    public PutawayTaskStatus Status { get; private set; }
    public string? OperatorId { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    // Navigation properties
    public Bin SourceBin { get; private set; } = default!;
    public Bin SuggestedBin { get; private set; } = default!;
    public Bin? ActualBin { get; private set; }

    private PutawayTask() { }

    public PutawayTask(
        string tenantId,
        Guid warehouseId,
        Guid receiptId,
        string sku,
        string? lotNo,
        int quantity,
        Guid sourceBinId,
        Guid suggestedBinId)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        WarehouseId = warehouseId;
        ReceiptId = receiptId;
        Sku = sku;
        LotNo = lotNo;
        Quantity = quantity;
        SourceBinId = sourceBinId;
        SuggestedBinId = suggestedBinId;
        Status = PutawayTaskStatus.Pending;
    }

    public void Complete(Guid actualBinId, string operatorId)
    {
        if (Status != PutawayTaskStatus.Pending)
            throw new InvalidOperationException($"Cannot complete PutawayTask {Id} in status {Status}");

        ActualBinId = actualBinId;
        OperatorId = operatorId;
        Status = PutawayTaskStatus.Completed;
        CompletedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        if (Status != PutawayTaskStatus.Pending)
            throw new InvalidOperationException($"Cannot cancel PutawayTask {Id} in status {Status}");

        Status = PutawayTaskStatus.Cancelled;
    }
}
