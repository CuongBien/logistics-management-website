using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum ReconciliationStatus
{
    Pending = 1,    // Chờ xử lý/Kiểm tra lại
    Resolved = 2,   // Đã xử lý (Cân bằng lại kho)
    Ignored = 3     // Bỏ qua
}

public class InventoryReconciliationReport : Entity<Guid>
{
    public Guid InventoryItemId { get; private set; }
    public string Sku { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }

    public int SnapshotQty { get; private set; }
    public int LedgerQty { get; private set; }
    public int Difference => SnapshotQty - LedgerQty;

    public DateTime DetectedAt { get; private set; }
    public ReconciliationStatus Status { get; private set; }
    public string? ResolutionNotes { get; private set; }

    // EF Core
    private InventoryReconciliationReport() { }

    public static InventoryReconciliationReport Create(InventoryItem item, int ledgerQty)
    {
        return new InventoryReconciliationReport
        {
            Id = Guid.NewGuid(),
            InventoryItemId = item.Id,
            Sku = item.Sku,
            WarehouseId = item.WarehouseId,
            BinId = item.BinId,
            SnapshotQty = item.QuantityOnHand,
            LedgerQty = ledgerQty,
            DetectedAt = DateTime.UtcNow,
            Status = ReconciliationStatus.Pending
        };
    }

    public void Resolve(string notes)
    {
        Status = ReconciliationStatus.Resolved;
        ResolutionNotes = notes;
    }

    public void Ignore(string notes)
    {
        Status = ReconciliationStatus.Ignored;
        ResolutionNotes = notes;
    }
}
