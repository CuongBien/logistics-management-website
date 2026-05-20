namespace Warehouse.Domain.Entities;

public class OperatorWarehouseScope
{
    public Guid OperatorProfileId { get; private set; }
    public Guid WarehouseId { get; private set; }

    // Navigation properties
    public OperatorProfile OperatorProfile { get; private set; } = default!;
    public Warehouse Warehouse { get; private set; } = default!;

    private OperatorWarehouseScope() { }

    public OperatorWarehouseScope(Guid operatorProfileId, Guid warehouseId)
    {
        OperatorProfileId = operatorProfileId;
        WarehouseId = warehouseId;
    }
}
