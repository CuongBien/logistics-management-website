using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum PickTaskStatus
{
    Pending = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    Failed = 4
}

public class PickTask : Entity<Guid>
{
    public Guid OutboundLineId { get; private set; }
    public Guid FromBinId { get; private set; }
    public int Qty { get; private set; }
    public PickTaskStatus Status { get; private set; }
    
    public string? WaveId { get; private set; }
    public DateTime? PickedAt { get; private set; }

    private PickTask() { }

    public PickTask(Guid outboundLineId, Guid fromBinId, int qty, string? waveId = null)
    {
        if (qty <= 0)
            throw new ArgumentException("Pick quantity must be greater than 0");

        Id = Guid.NewGuid();
        OutboundLineId = outboundLineId;
        FromBinId = fromBinId;
        Qty = qty;
        Status = PickTaskStatus.Pending;
        WaveId = waveId;
    }

    public void StartTask()
    {
        if (Status != PickTaskStatus.Pending)
            throw new InvalidOperationException("Can only start pending tasks");
            
        Status = PickTaskStatus.InProgress;
    }

    public void CompleteTask()
    {
        if (Status != PickTaskStatus.InProgress && Status != PickTaskStatus.Pending)
            throw new InvalidOperationException("Invalid state transition for PickTask");

        Status = PickTaskStatus.Completed;
        PickedAt = DateTime.UtcNow;
    }

    public void CancelTask()
    {
        Status = PickTaskStatus.Cancelled;
    }
}
