using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class Bin : Entity<Guid>, ISoftDelete
{
    public Guid ZoneId { get; private set; }
    public string BinCode { get; private set; } = default!;
    public BinStatus Status { get; private set; }
    public uint Version { get; private set; }
    public bool IsDeleted { get; private set; }

    // Navigation
    public Zone Zone { get; private set; } = default!;

    // EF Core
    private Bin() { }

    public Bin(Guid zoneId, string binCode, BinStatus status = BinStatus.Available)
    {
        Id = Guid.NewGuid();
        ZoneId = zoneId;
        BinCode = binCode;
        Status = status;
        Version = 1;
    }

    public void UpdateStatus(BinStatus newStatus)
    {
        Status = newStatus;
        Version++;
    }

    public void Delete()
    {
        IsDeleted = true;
    }
}