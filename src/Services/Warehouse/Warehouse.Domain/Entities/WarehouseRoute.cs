using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class WarehouseRoute : Entity<Guid>, IAggregateRoot
{
    public Guid SourceWarehouseId { get; private set; }
    public Guid DestinationWarehouseId { get; private set; }
    public Guid NextHopWarehouseId { get; private set; }

    private WarehouseRoute() { }

    public WarehouseRoute(Guid sourceWarehouseId, Guid destinationWarehouseId, Guid nextHopWarehouseId)
    {
        Id = Guid.NewGuid();
        SourceWarehouseId = sourceWarehouseId;
        DestinationWarehouseId = destinationWarehouseId;
        NextHopWarehouseId = nextHopWarehouseId;
    }

    public void UpdateNextHop(Guid nextHopWarehouseId)
    {
        NextHopWarehouseId = nextHopWarehouseId;
    }
}
