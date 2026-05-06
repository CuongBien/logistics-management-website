using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class Zone : Entity<Guid>, ISoftDelete
{
    public Guid BlockId { get; private set; }
    public string ZoneType { get; private set; } = default!;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    public Block Block { get; private set; } = default!;
    private readonly List<Bin> _bins = new();
    public IReadOnlyCollection<Bin> Bins => _bins.AsReadOnly();

    // EF Core
    private Zone() { }

    public Zone(Guid blockId, ZoneType zoneType)
    {
        Id = Guid.NewGuid();
        BlockId = blockId;
        ZoneType = zoneType.ToString();
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void AddBin(Bin bin)
    {
        _bins.Add(bin);
    }
}