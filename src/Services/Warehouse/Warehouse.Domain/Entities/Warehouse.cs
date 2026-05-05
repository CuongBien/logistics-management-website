using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Warehouse : Entity<Guid>, IAggregateRoot, ISoftDelete
{
    public string Code { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public string LocationText { get; private set; } = default!;
    public bool IsDeleted { get; private set; }

    // Navigation
    private readonly List<Block> _blocks = new();
    public IReadOnlyCollection<Block> Blocks => _blocks.AsReadOnly();

    // EF Core
    private Warehouse() { }

    public Warehouse(string code, string name, string locationText)
    {
        Id = Guid.NewGuid();
        Code = code;
        Name = name;
        LocationText = locationText;
    }

    public void AddBlock(Block block)
    {
        _blocks.Add(block);
    }

    public void Delete()
    {
        IsDeleted = true;
    }
}