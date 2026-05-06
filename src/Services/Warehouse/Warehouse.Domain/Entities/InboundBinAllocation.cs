using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InboundBinAllocation : Entity<Guid>, ISoftDelete
{
    public Guid ReceiptLineId { get; private set; }
    public Guid BinId { get; private set; }
    public int Quantity { get; private set; }
    public PutawayStatus Status { get; private set; }
    public string TenantId { get; private set; } = default!;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    public InboundReceiptLine ReceiptLine { get; private set; } = default!;
    public Bin Bin { get; private set; } = default!;

    // EF Core
    private InboundBinAllocation() { }

    public InboundBinAllocation(Guid receiptLineId, Guid binId, int quantity, string tenantId)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity), "Allocation quantity must be greater than zero.");

        Id = Guid.NewGuid();
        ReceiptLineId = receiptLineId;
        BinId = binId;
        Quantity = quantity;
        TenantId = tenantId;
        Status = PutawayStatus.Completed; // Default to completed for simple direct putaway
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
        Quantity += additionalQuantity;
    }
}
