using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InboundReceiptLine : Entity<Guid>, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid ReceiptId { get; private set; }
    public int LineNo { get; private set; }
    public string SkuCode { get; private set; } = default!;
    public string Uom { get; private set; } = default!;
    public int ExpectedQty { get; private set; }
    public int ReceivedQty { get; private set; }
    public int RejectedQty { get; private set; }
    public string? RejectionReason { get; private set; }
    public int ShortageQty { get; private set; }
    public string? LotNo { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public InboundReceiptLineStatus Status { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    public InboundReceipt Receipt { get; private set; } = default!;
    
    private readonly List<InboundBinAllocation> _allocations = new();
    public IReadOnlyCollection<InboundBinAllocation> Allocations => _allocations.AsReadOnly();

    // EF Core
    private InboundReceiptLine() { }

    public InboundReceiptLine(Guid receiptId, int lineNo, string tenantId, string customerId, string skuCode, string uom, int expectedQty)
    {
        if (expectedQty <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(expectedQty), "Expected quantity must be greater than zero.");
        }

        Id = Guid.NewGuid();
        ReceiptId = receiptId;
        LineNo = lineNo;
        TenantId = tenantId;
        CustomerId = customerId;
        SkuCode = skuCode;
        Uom = uom;
        ExpectedQty = expectedQty;
        ReceivedQty = 0;
        RejectedQty = 0;
        ShortageQty = 0;
        Status = InboundReceiptLineStatus.Pending;
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void Receive(int goodQty, int rejectedQty = 0, string? rejectionReason = null, string? lotNo = null, DateTime? expiryDate = null)
    {
        if (goodQty < 0 || rejectedQty < 0) throw new ArgumentOutOfRangeException("Quantities cannot be negative.");
        if (rejectedQty > 0 && string.IsNullOrWhiteSpace(rejectionReason)) 
            throw new ArgumentException("Rejection reason is required when rejected quantity is > 0.", nameof(rejectionReason));

        int totalAttempted = ReceivedQty + RejectedQty + goodQty + rejectedQty;
        if (totalAttempted > ExpectedQty)
        {
            throw new InvalidOperationException($"Cannot receive more than expected. Expected: {ExpectedQty}, Attempting Total: {totalAttempted}");
        }

        ReceivedQty += goodQty;
        RejectedQty += rejectedQty;
        
        if (rejectedQty > 0)
        {
            RejectionReason = rejectionReason;
        }

        if (!string.IsNullOrEmpty(lotNo)) LotNo = lotNo;
        if (expiryDate.HasValue) ExpiryDate = expiryDate;

        UpdateStatus();
    }

    public void ForceClose()
    {
        if (Status == InboundReceiptLineStatus.Completed) return;

        int totalProcessed = ReceivedQty + RejectedQty;
        if (totalProcessed < ExpectedQty)
        {
            ShortageQty = ExpectedQty - totalProcessed;
        }

        Status = InboundReceiptLineStatus.Completed;
        Receipt?.RecalculateStatus();
    }

    private void UpdateStatus()
    {
        if (ReceivedQty + RejectedQty == ExpectedQty)
        {
            Status = InboundReceiptLineStatus.Completed;
        }
        else if (ReceivedQty + RejectedQty > 0)
        {
            Status = InboundReceiptLineStatus.PartiallyReceived;
        }
        else
        {
            Status = InboundReceiptLineStatus.Pending;
        }

        Receipt?.RecalculateStatus();
    }

    public void AddAllocation(InboundBinAllocation allocation)
    {
        ArgumentNullException.ThrowIfNull(allocation);
        var totalAfter = _allocations.Sum(a => a.AllocatedQty) + allocation.AllocatedQty;
        if (totalAfter > ReceivedQty)
        {
            throw new InvalidOperationException(
                $"Total allocated quantity ({totalAfter}) cannot exceed received quantity ({ReceivedQty}).");
        }

        _allocations.Add(allocation);
    }

    /// <summary>Total quantity already allocated to bins for this line.</summary>
    public int GetTotalAllocatedQty() => _allocations.Sum(a => a.AllocatedQty);
}