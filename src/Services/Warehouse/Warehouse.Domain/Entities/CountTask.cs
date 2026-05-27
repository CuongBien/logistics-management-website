using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum CountTaskStatus
{
    Pending,
    Counted,
    Adjusted,
    Cancelled
}

public class CountTask : Entity<Guid>, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int ExpectedQty { get; private set; }
    public int? CountedQty { get; private set; }
    public CountTaskStatus Status { get; private set; }
    public string? AssignedTo { get; private set; }
    
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public Bin Bin { get; private set; } = default!;

    private CountTask() { }

    public CountTask(string tenantId, Guid warehouseId, Guid binId, string sku, int expectedQty)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        WarehouseId = warehouseId;
        BinId = binId;
        Sku = sku;
        ExpectedQty = expectedQty;
        Status = CountTaskStatus.Pending;
        IsDeleted = false;
    }

    public void Assign(string operatorId)
    {
        AssignedTo = operatorId;
    }

    public void SubmitCount(int countedQty)
    {
        if (Status != CountTaskStatus.Pending)
            throw new InvalidOperationException("Can only submit count for pending tasks.");
            
        CountedQty = countedQty;
        Status = CountTaskStatus.Counted;
    }

    public void MarkAdjusted()
    {
        if (Status != CountTaskStatus.Counted)
            throw new InvalidOperationException("Can only adjust counted tasks.");
            
        Status = CountTaskStatus.Adjusted;
    }

    public void Cancel()
    {
        Status = CountTaskStatus.Cancelled;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }
}
