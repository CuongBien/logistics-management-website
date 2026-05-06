using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class InboundReceiptLine : Entity<Guid>, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid ReceiptId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int ExpectedQuantity { get; private set; }
    public int ReceivedQuantity { get; private set; }
    public string? LotNo { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    public InboundReceipt Receipt { get; private set; } = default!;
    
    private readonly List<InboundBinAllocation> _allocations = new();
    public IReadOnlyCollection<InboundBinAllocation> Allocations => _allocations.AsReadOnly();

    // EF Core
    private InboundReceiptLine() { }

    public InboundReceiptLine(Guid receiptId, string tenantId, string customerId, string sku, int expectedQuantity)
    {
        if (expectedQuantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(expectedQuantity), "Expected quantity must be greater than zero.");
        }

        Id = Guid.NewGuid();
        ReceiptId = receiptId;
        TenantId = tenantId;
        CustomerId = customerId;
        Sku = sku;
        ExpectedQuantity = expectedQuantity;
        ReceivedQuantity = 0;
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void AddReceivedQuantity(int quantity, string? lotNo = null, DateTime? expiryDate = null)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        
        ReceivedQuantity += quantity;
        
        // Update lot/expiry if provided (usually for the first receive or if all match)
        if (!string.IsNullOrEmpty(lotNo)) LotNo = lotNo;
        if (expiryDate.HasValue) ExpiryDate = expiryDate;
    }

    public void AddAllocation(InboundBinAllocation allocation)
    {
        _allocations.Add(allocation);
    }
}