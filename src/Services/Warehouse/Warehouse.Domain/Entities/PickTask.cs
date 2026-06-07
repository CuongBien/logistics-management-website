using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum PickTaskStatus
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4,
    Failed = 5
}

public class PickTask : Entity<Guid>
{
    public Guid OutboundOrderLineId { get; private set; }
    public Guid FromBinId { get; private set; }
    public int Quantity { get; private set; }
    public PickTaskStatus Status { get; private set; }
    public string? AssignedOperatorId { get; private set; }
    public string? WaveId { get; private set; }
    public DateTime? PickedAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? StartedAt { get; private set; }
    
    // Put-To-Wall
    public string? TargetCubbyBinCode { get; private set; }
    public DateTime? PutToWallAt { get; private set; }

    // Navigation Properties
    public virtual OutboundOrderLine OutboundOrderLine { get; private set; } = default!;
    public virtual Bin FromBin { get; private set; } = default!;

    private PickTask() { }

    public PickTask(Guid outboundOrderLineId, Guid fromBinId, int quantity, string? waveId = null)
    {
        if (quantity <= 0)
            throw new ArgumentException("Pick quantity must be greater than 0");

        Id = Guid.NewGuid();
        OutboundOrderLineId = outboundOrderLineId;
        FromBinId = fromBinId;
        Quantity = quantity;
        Status = PickTaskStatus.Pending;
        WaveId = waveId;
        CreatedAt = DateTime.UtcNow;
    }

    public static PickTask Create(Guid outboundOrderLineId, Guid fromBinId, int quantity, string? waveId = null)
    {
        return new PickTask(outboundOrderLineId, fromBinId, quantity, waveId);
    }

    public void Start(string operatorId)
    {
        if (Status != PickTaskStatus.Pending)
            throw new InvalidOperationException($"Cannot start task in status {Status}");

        Status = PickTaskStatus.InProgress;
        AssignedOperatorId = operatorId;
        StartedAt = DateTime.UtcNow;
    }

    public void Complete(string operatorId)
    {
        if (Status != PickTaskStatus.Pending && Status != PickTaskStatus.InProgress)
            throw new InvalidOperationException($"Cannot complete task from status {Status}");

        Status = PickTaskStatus.Completed;
        AssignedOperatorId = operatorId;
        PickedAt = DateTime.UtcNow;
        if (StartedAt == null)
        {
            StartedAt = CreatedAt;
        }
    }

    public void Cancel()
    {
        Status = PickTaskStatus.Cancelled;
    }

    public void Fail(string operatorId, string reason)
    {
        Status = PickTaskStatus.Failed;
        AssignedOperatorId = operatorId;
        // Có thể thêm trường Remark/Reason sau này nếu cần
    }

    public void PutToWall(string cubbyBinCode)
    {
        if (Status != PickTaskStatus.Completed)
            throw new InvalidOperationException($"Cannot put to wall from status {Status}");
            
        TargetCubbyBinCode = cubbyBinCode;
        PutToWallAt = DateTime.UtcNow;
    }
}
