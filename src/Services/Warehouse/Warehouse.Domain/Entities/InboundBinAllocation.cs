using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InboundBinAllocation : Entity<Guid>, ISoftDelete
{
    public Guid ReceiptLineId { get; private set; }
    public Guid BinId { get; private set; }
    public int AllocatedQty { get; private set; }
    public PutawayStatus Status { get; private set; }
    public string TenantId { get; private set; } = default!;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    public InboundReceiptLine ReceiptLine { get; private set; } = default!;
    public Bin Bin { get; private set; } = default!;

    // EF Core
    private InboundBinAllocation() { }

    public InboundBinAllocation(Guid receiptLineId, Guid binId, int allocatedQty, string tenantId)
    {
        if (allocatedQty <= 0) throw new ArgumentOutOfRangeException(nameof(allocatedQty), "Allocation quantity must be greater than zero.");

        Id = Guid.NewGuid();
        ReceiptLineId = receiptLineId;
        BinId = binId;
        AllocatedQty = allocatedQty;
        TenantId = tenantId;
        Status = PutawayStatus.PutawayCompleted; // Default to completed for simple direct putaway
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void AddQuantity(int additionalQuantity)
    {
        if (additionalQuantity <= 0) throw new ArgumentOutOfRangeException(nameof(additionalQuantity), "Must add a positive quantity.");
        AllocatedQty += additionalQuantity;
    }
}
