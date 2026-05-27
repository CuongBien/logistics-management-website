using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum ReplenishmentTaskStatus
{
    Pending,
    InProgress,
    Completed,
    Cancelled
}

public class ReplenishmentTask : Entity<Guid>, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public string Sku { get; private set; } = default!;
    public Guid SourceBinId { get; private set; }
    public Guid DestinationBinId { get; private set; }
    public int RequestedQty { get; private set; }
    public ReplenishmentTaskStatus Status { get; private set; }
    public string? AssignedTo { get; private set; }
    
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public Bin SourceBin { get; private set; } = default!;
    public Bin DestinationBin { get; private set; } = default!;

    private ReplenishmentTask() { }

    public ReplenishmentTask(string tenantId, Guid warehouseId, string sku, Guid sourceBinId, Guid destinationBinId, int requestedQty)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        WarehouseId = warehouseId;
        Sku = sku;
        SourceBinId = sourceBinId;
        DestinationBinId = destinationBinId;
        RequestedQty = requestedQty;
        Status = ReplenishmentTaskStatus.Pending;
        IsDeleted = false;
    }

    public void Assign(string operatorId)
    {
        AssignedTo = operatorId;
    }

    public void Start()
    {
        if (Status != ReplenishmentTaskStatus.Pending)
            throw new InvalidOperationException("Can only start pending tasks.");
            
        Status = ReplenishmentTaskStatus.InProgress;
    }

    public void Complete()
    {
        if (Status != ReplenishmentTaskStatus.InProgress && Status != ReplenishmentTaskStatus.Pending)
            throw new InvalidOperationException("Can only complete in-progress tasks.");
            
        Status = ReplenishmentTaskStatus.Completed;
    }

    public void Cancel()
    {
        Status = ReplenishmentTaskStatus.Cancelled;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }
}
