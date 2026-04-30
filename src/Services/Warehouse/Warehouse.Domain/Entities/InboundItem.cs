using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class InboundItem : Entity<Guid>
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid ReceiptId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int Quantity { get; private set; }
    public Guid? BinId { get; private set; }

    // Navigation
    public InboundReceipt Receipt { get; private set; } = default!;
    public Bin? Bin { get; private set; }

    // EF Core
    private InboundItem() { }

    public InboundItem(Guid receiptId, string sku, int quantity, string tenantId, string customerId)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Inbound quantity must be greater than zero.");
        }

        Id = Guid.NewGuid();
        ReceiptId = receiptId;
        Sku = sku;
        Quantity = quantity;
        TenantId = tenantId;
        CustomerId = customerId;
    }

    public void AssignToBin(Guid binId)
    {
        BinId = binId;
    }
}