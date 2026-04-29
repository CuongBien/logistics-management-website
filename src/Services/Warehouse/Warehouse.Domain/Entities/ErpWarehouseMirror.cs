using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class ErpWarehouseMirror : Entity<Guid>
{
    public string TenantId { get; private set; } = default!;
    public string ErpWarehouseId { get; private set; } = default!;
    public string WarehouseCode { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public string Status { get; private set; } = default!;
    public DateTime UpdatedAtErp { get; private set; }
    public DateTime SyncedAt { get; private set; }

    private ErpWarehouseMirror()
    {
    }

    public static ErpWarehouseMirror Create(
        string tenantId,
        string erpWarehouseId,
        string warehouseCode,
        string name,
        string status,
        DateTime updatedAtErp,
        DateTime syncedAt)
    {
        return new ErpWarehouseMirror
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ErpWarehouseId = erpWarehouseId,
            WarehouseCode = warehouseCode,
            Name = name,
            Status = status,
            UpdatedAtErp = updatedAtErp,
            SyncedAt = syncedAt
        };
    }

    public void ApplySync(string name, string status, DateTime updatedAtErp, DateTime syncedAt)
    {
        Name = name;
        Status = status;
        UpdatedAtErp = updatedAtErp;
        SyncedAt = syncedAt;
    }
}
