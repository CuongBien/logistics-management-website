using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class TaskOverrideLog : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public string OperatorId { get; private set; } = default!;
    public string TaskType { get; private set; } = default!; // Putaway, Pick, Replenish
    public Guid TaskId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int Quantity { get; private set; }
    public string OriginalBinCode { get; private set; } = default!;
    public string ActualBinCode { get; private set; } = default!;
    public string? Reason { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private TaskOverrideLog() { }

    public TaskOverrideLog(
        string tenantId,
        Guid warehouseId,
        string operatorId,
        string taskType,
        Guid taskId,
        string sku,
        int quantity,
        string originalBinCode,
        string actualBinCode,
        string? reason = null)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        WarehouseId = warehouseId;
        OperatorId = operatorId;
        TaskType = taskType;
        TaskId = taskId;
        Sku = sku;
        Quantity = quantity;
        OriginalBinCode = originalBinCode;
        ActualBinCode = actualBinCode;
        Reason = reason;
        CreatedAt = DateTime.UtcNow;
    }
}
