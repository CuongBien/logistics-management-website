using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Bin : Entity<Guid>
{
    public Guid ZoneId { get; private set; }
    public string BinCode { get; private set; } = default!;
    public string Status { get; private set; } = default!;
    public int Version { get; private set; }

    // Navigation
    public Zone Zone { get; private set; } = default!;

    // EF Core
    private Bin() { }

    public Bin(Guid zoneId, string binCode, string status = "Available")
    {
        Id = Guid.NewGuid();
        ZoneId = zoneId;
        BinCode = binCode;
        Status = status;
        Version = 1;
    }

    public void UpdateStatus(string newStatus)
    {
        Status = newStatus;
        Version++;
    }
}