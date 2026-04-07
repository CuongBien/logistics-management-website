using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Zone : Entity<Guid>
{
    public Guid BlockId { get; private set; }
    public string ZoneType { get; private set; } = default!;

    // Navigation
    public Block Block { get; private set; } = default!;
    private readonly List<Bin> _bins = new();
    public IReadOnlyCollection<Bin> Bins => _bins.AsReadOnly();

    // EF Core
    private Zone() { }

    public Zone(Guid blockId, string zoneType)
    {
        Id = Guid.NewGuid();
        BlockId = blockId;
        ZoneType = zoneType;
    }

    public void AddBin(Bin bin)
    {
        _bins.Add(bin);
    }
}