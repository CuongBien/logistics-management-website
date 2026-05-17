using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Warehouse : Entity<Guid>, IAggregateRoot, ISoftDelete
{
    public string Name { get; private set; } = default!;
    public string Code { get; private set; } = default!;
    public string LocationText { get; private set; } = default!;
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    private readonly List<Block> _blocks = new();
    public IReadOnlyCollection<Block> Blocks => _blocks.AsReadOnly();

    // EF Core
    private Warehouse() { }

    public Warehouse(string name, string code, string locationText)
    {
        Id = Guid.NewGuid();
        Name = name;
        Code = code;
        LocationText = locationText;
        IsDeleted = false;
    }

    public Warehouse(Guid id, string name, string code, string locationText)
    {
        Id = id;
        Name = name;
        Code = code;
        LocationText = locationText;
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