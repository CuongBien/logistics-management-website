using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class InboundItem : Entity<Guid>
{
    public Guid ReceiptId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int Quantity { get; private set; }
    public Guid? BinId { get; private set; }

    // Navigation
    public InboundReceipt Receipt { get; private set; } = default!;
    public Bin? Bin { get; private set; }

    // EF Core
    private InboundItem() { }

    public InboundItem(Guid receiptId, string sku, int quantity)
    {
        Id = Guid.NewGuid();
        ReceiptId = receiptId;
        Sku = sku;
        Quantity = quantity;
    }

    public void AssignToBin(Guid binId)
    {
        BinId = binId;
    }
}