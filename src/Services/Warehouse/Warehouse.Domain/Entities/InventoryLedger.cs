using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InventoryLedger : Entity<Guid>
{
    public Guid InventoryItemId { get; private set; }
    public InventoryTransactionType TransactionType { get; private set; }
    
    /// <summary>
    /// Lượng thay đổi (+ hoặc -)
    /// </summary>
    public int QuantityChange { get; private set; }
    
    /// <summary>
    /// Số dư thực tế (QuantityOnHand) sau khi thay đổi
    /// </summary>
    public int BalanceAfter { get; private set; }
    
    public string ReferenceId { get; private set; } = default!;
    public string? OperatorSub { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation
    public virtual InventoryItem InventoryItem { get; private set; } = default!;

    // EF Core
    private InventoryLedger() { }

    public static InventoryLedger Create(
        Guid inventoryItemId,
        InventoryTransactionType transactionType,
        int quantityChange,
        int balanceAfter,
        string referenceId,
        string? operatorSub = null,
        string? correlationId = null)
    {
        return new InventoryLedger
        {
            Id = Guid.NewGuid(),
            InventoryItemId = inventoryItemId,
            TransactionType = transactionType,
            QuantityChange = quantityChange,
            BalanceAfter = balanceAfter,
            ReferenceId = referenceId,
            OperatorSub = operatorSub,
            CorrelationId = correlationId,
            CreatedAt = DateTime.UtcNow
        };
    }
}
