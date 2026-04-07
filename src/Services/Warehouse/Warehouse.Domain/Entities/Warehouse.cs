using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Warehouse : Entity<Guid>, IAggregateRoot
{
    public string Name { get; private set; } = default!;
    public string LocationText { get; private set; } = default!;

    // Navigation
    private readonly List<Block> _blocks = new();
    public IReadOnlyCollection<Block> Blocks => _blocks.AsReadOnly();

    // EF Core
    private Warehouse() { }

    public Warehouse(string name, string locationText)
    {
        Id = Guid.NewGuid();
        Name = name;
        LocationText = locationText;
    }

    public void AddBlock(Block block)
    {
        _blocks.Add(block);
    }
}