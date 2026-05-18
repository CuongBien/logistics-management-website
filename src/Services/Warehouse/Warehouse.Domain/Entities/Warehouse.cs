using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Warehouse : Entity<Guid>, IAggregateRoot, ISoftDelete
{
    public string Name { get; private set; } = default!;
    public string Code { get; private set; } = default!;
    public string LocationText { get; private set; } = default!;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // BUG-12 FIX: GPS Coordinates stored in DB instead of hardcoded in a static helper.
    // Allows new warehouses added via DB/API to participate in Haversine distance calculations.
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }

    // Navigation
    private readonly List<Block> _blocks = new();
    public IReadOnlyCollection<Block> Blocks => _blocks.AsReadOnly();

    // EF Core
    private Warehouse() { }

    public Warehouse(string name, string code, string locationText, double? latitude = null, double? longitude = null)
    {
        Id = Guid.NewGuid();
        Name = name;
        Code = code;
        LocationText = locationText;
        Latitude = latitude;
        Longitude = longitude;
        IsDeleted = false;
    }

    public Warehouse(Guid id, string name, string code, string locationText, double? latitude = null, double? longitude = null)
    {
        Id = id;
        Name = name;
        Code = code;
        LocationText = locationText;
        Latitude = latitude;
        Longitude = longitude;
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void AddBlock(Block block)
    {
        _blocks.Add(block);
    }
}