using System;
using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class InventoryReconciliationReport : Entity<Guid>
{
    private InventoryReconciliationReport() { }

    public InventoryReconciliationReport(string sku, Guid warehouseId, Guid binId, int ledgerSum, int qtyOnHand)
    {
        Id = Guid.NewGuid();
        Sku = sku;
        WarehouseId = warehouseId;
        BinId = binId;
        LedgerSum = ledgerSum;
        QtyOnHand = qtyOnHand;
        Difference = QtyOnHand - LedgerSum;
        CheckedAt = DateTime.UtcNow;
    }

    public string Sku { get; private set; } = null!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }
    public int LedgerSum { get; private set; }
    public int QtyOnHand { get; private set; }
    public int Difference { get; private set; }
    public DateTime CheckedAt { get; private set; }
}
