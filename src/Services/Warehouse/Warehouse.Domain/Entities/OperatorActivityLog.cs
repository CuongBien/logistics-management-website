using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class OperatorActivityLog : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public string OperatorId { get; private set; } = default!;
    public string TaskType { get; private set; } = default!; // Putaway, Pick, Replenish, Count
    public Guid TaskId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int Quantity { get; private set; }
    public DateTime StartedAt { get; private set; }
    public DateTime CompletedAt { get; private set; }
    public double DurationSeconds { get; private set; }

    private OperatorActivityLog() { }

    public OperatorActivityLog(
        string tenantId,
        Guid warehouseId,
        string operatorId,
        string taskType,
        Guid taskId,
        string sku,
        int quantity,
        DateTime startedAt,
        DateTime completedAt)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        WarehouseId = warehouseId;
        OperatorId = operatorId;
        TaskType = taskType;
        TaskId = taskId;
        Sku = sku;
        Quantity = quantity;
        StartedAt = startedAt;
        CompletedAt = completedAt;
        DurationSeconds = (completedAt - startedAt).TotalSeconds;
    }
}
