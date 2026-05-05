using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Block : Entity<Guid>, ISoftDelete
{
    public Guid WarehouseId { get; private set; }
    public string BlockCode { get; private set; } = default!;
    public bool IsDeleted { get; private set; }

    // Navigation
    public Warehouse Warehouse { get; private set; } = default!;
    private readonly List<Zone> _zones = new();
    public IReadOnlyCollection<Zone> Zones => _zones.AsReadOnly();

    // EF Core
    private Block() { }

    public Block(Guid warehouseId, string blockCode)
    {
        Id = Guid.NewGuid();
        WarehouseId = warehouseId;
        BlockCode = blockCode;
    }

    public void AddZone(Zone zone)
    {
        _zones.Add(zone);
    }

    public void Delete()
    {
        IsDeleted = true;
    }
}