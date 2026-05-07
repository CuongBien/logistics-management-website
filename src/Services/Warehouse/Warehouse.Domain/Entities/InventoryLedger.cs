using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InventoryLedger : Entity<Guid>
{
    public Guid InventoryItemId { get; private set; }
    
    // Denormalized fields (Audit-proof)
    public string Sku { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }
    
    public InventoryLedgerReason Reason { get; private set; }
    
    /// <summary>
    /// Lượng thay đổi vật lý (+ hoặc -). 
    /// Có thể bằng 0 nếu chỉ là biến động logic (Reserve/Release).
    /// </summary>
    public int DeltaQty { get; private set; }
    
    /// <summary>
    /// Số dư thực tế (QuantityOnHand) sau khi thay đổi
    /// </summary>
    public int BalanceAfter { get; private set; }
    
    public string? ReferenceType { get; private set; }
    public string? ReferenceId { get; private set; }
    public string? OperatorSub { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTime OccurredAt { get; private set; }

    // Navigation
    public virtual InventoryItem InventoryItem { get; private set; } = default!;

    // EF Core
    private InventoryLedger() { }

    public static InventoryLedger Create(
        InventoryItem item,
        InventoryLedgerReason reason,
        int deltaQty,
        string? referenceId = null,
        string? referenceType = null,
        string? operatorSub = null,
        string? correlationId = null)
    {
        return new InventoryLedger
        {
            Id = Guid.NewGuid(),
            InventoryItemId = item.Id,
            Sku = item.Sku,
            WarehouseId = item.WarehouseId,
            BinId = item.BinId,
            Reason = reason,
            DeltaQty = deltaQty,
            BalanceAfter = item.QuantityOnHand,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            OperatorSub = operatorSub,
            CorrelationId = correlationId,
            OccurredAt = DateTime.UtcNow
        };
    }
}
