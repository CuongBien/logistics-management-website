using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum WaveType
{
    SingleItem = 1,
    MultiItem = 2
}

public enum WaveStatus
{
    New = 1,
    Picking = 2,
    Completed = 3,
    Cancelled = 4
}

public class Wave : Entity<Guid>, IAggregateRoot
{
    public string WaveNo { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public WaveType Type { get; private set; }
    public int OrderCount { get; private set; }
    public WaveStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string? AssignedOperatorId { get; private set; }

    private Wave() { }

    public Wave(string waveNo, Guid warehouseId, WaveType type, int orderCount)
    {
        Id = Guid.NewGuid();
        WaveNo = waveNo;
        WarehouseId = warehouseId;
        Type = type;
        OrderCount = orderCount;
        Status = WaveStatus.New;
        CreatedAt = DateTime.UtcNow;
    }

    public static Wave Create(string waveNo, Guid warehouseId, WaveType type, int orderCount)
    {
        return new Wave(waveNo, warehouseId, type, orderCount);
    }

    public void Assign(string operatorId)
    {
        AssignedOperatorId = operatorId;
    }

    public void StartPicking()
    {
        if (Status != WaveStatus.New)
            throw new InvalidOperationException($"Cannot start picking from status {Status}");
            
        Status = WaveStatus.Picking;
    }

    public void Complete()
    {
        if (Status != WaveStatus.Picking)
            throw new InvalidOperationException($"Cannot complete from status {Status}");
            
        Status = WaveStatus.Completed;
    }

    public void Cancel()
    {
        Status = WaveStatus.Cancelled;
    }
}
