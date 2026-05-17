using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class WarehouseRoute : Entity<Guid>, IAggregateRoot
{
    public Guid SourceWarehouseId { get; private set; }
    public Guid DestinationWarehouseId { get; private set; }
    
    // Comma-separated list of Warehouse IDs representing the sequence of hops
    public string Hops { get; private set; } = default!; 

    private WarehouseRoute() { }

    public WarehouseRoute(Guid sourceWarehouseId, Guid destinationWarehouseId, string hops)
    {
        Id = Guid.NewGuid();
        SourceWarehouseId = sourceWarehouseId;
        DestinationWarehouseId = destinationWarehouseId;
        Hops = hops;
    }

    public void UpdateHops(string hops)
    {
        Hops = hops;
    }

    // Utility to get hops list parsed as Guid list
    public IReadOnlyList<Guid> GetParsedHops()
    {
        if (string.IsNullOrWhiteSpace(Hops)) return Array.Empty<Guid>();
        return Hops.Split(',')
            .Select(x => Guid.TryParse(x.Trim(), out var g) ? g : Guid.Empty)
            .Where(x => x != Guid.Empty)
            .ToList();
    }
}
