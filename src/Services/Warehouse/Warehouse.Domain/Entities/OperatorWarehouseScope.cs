using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class OperatorWarehouseScope : Entity<Guid>
{
    public Guid OperatorProfileId { get; private set; }
    public Guid WarehouseId { get; private set; }

    public OperatorProfile OperatorProfile { get; private set; } = default!;
    public Warehouse Warehouse { get; private set; } = default!;

    private OperatorWarehouseScope() { }

    public OperatorWarehouseScope(Guid operatorProfileId, Guid warehouseId)
    {
        Id = Guid.NewGuid();
        OperatorProfileId = operatorProfileId;
        WarehouseId = warehouseId;
    }
}
