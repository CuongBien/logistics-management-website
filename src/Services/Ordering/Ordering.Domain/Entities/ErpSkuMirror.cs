using Logistics.Core;

namespace Ordering.Domain.Entities;

public class ErpSkuMirror : Entity<Guid>
{
    public string TenantId { get; private set; } = default!;
    public string ErpSkuId { get; private set; } = default!;
    public string SkuCode { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public string UnitOfMeasure { get; private set; } = default!;
    public string Status { get; private set; } = default!;
    public DateTime UpdatedAtErp { get; private set; }
    public DateTime SyncedAt { get; private set; }

    private ErpSkuMirror()
    {
    }

    public static ErpSkuMirror Create(
        string tenantId,
        string erpSkuId,
        string skuCode,
        string name,
        string unitOfMeasure,
        string status,
        DateTime updatedAtErp,
        DateTime syncedAt)
    {
        return new ErpSkuMirror
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ErpSkuId = erpSkuId,
            SkuCode = skuCode,
            Name = name,
            UnitOfMeasure = unitOfMeasure,
            Status = status,
            UpdatedAtErp = updatedAtErp,
            SyncedAt = syncedAt
        };
    }

    public void ApplySync(
        string name,
        string unitOfMeasure,
        string status,
        DateTime updatedAtErp,
        DateTime syncedAt)
    {
        Name = name;
        UnitOfMeasure = unitOfMeasure;
        Status = status;
        UpdatedAtErp = updatedAtErp;
        SyncedAt = syncedAt;
    }
}
