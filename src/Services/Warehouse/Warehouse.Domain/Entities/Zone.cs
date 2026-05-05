using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class Zone : Entity<Guid>, ISoftDelete
{
    public Guid BlockId { get; private set; }
    public string ZoneCode { get; private set; } = default!;
    public ZoneType ZoneType { get; private set; }
    public bool IsDeleted { get; private set; }

    // Navigation
    public Block Block { get; private set; } = default!;
    private readonly List<Bin> _bins = new();
    public IReadOnlyCollection<Bin> Bins => _bins.AsReadOnly();

    // EF Core
    private Zone() { }

    public Zone(Guid blockId, string zoneCode, ZoneType zoneType)
    {
        Id = Guid.NewGuid();
        BlockId = blockId;
        ZoneCode = zoneCode;
        ZoneType = zoneType;
    }

    public void AddBin(Bin bin)
    {
        _bins.Add(bin);
    }

    public void Delete()
    {
        IsDeleted = true;
    }
}