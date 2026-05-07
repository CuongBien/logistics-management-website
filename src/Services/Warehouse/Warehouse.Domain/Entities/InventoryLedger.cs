using System;
using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum InventoryLedgerReason
{
    InboundReceived,
    Reserve,
    Release,
    Pick,
    Pack,
    Ship,
    Return,
    AdjustIncrease,
    AdjustDecrease,
    Expired
}

public class InventoryLedger : Entity<Guid>
{
    private InventoryLedger() { }

    public static InventoryLedger Create(string sku, Guid warehouseId, Guid binId, int deltaQty, InventoryLedgerReason reason, string? referenceType = null, string? referenceId = null, string? correlationId = null)
    {
        if (deltaQty == 0) throw new ArgumentOutOfRangeException(nameof(deltaQty), "deltaQty must not be zero");

        return new InventoryLedger
        {
            Id = Guid.NewGuid(),
            Sku = sku,
            WarehouseId = warehouseId,
            BinId = binId,
            DeltaQty = deltaQty,
            Reason = reason,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            CorrelationId = correlationId,
            OccurredAt = DateTime.UtcNow
        };
    }

    public string Sku { get; private set; } = null!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }
    public int DeltaQty { get; private set; }
    public InventoryLedgerReason Reason { get; private set; }
    public string? ReferenceType { get; private set; }
    public string? ReferenceId { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTime OccurredAt { get; private set; }
}
