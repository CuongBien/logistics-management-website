using Logistics.Core;

namespace Ordering.Domain.Entities;

public class ErpSyncCheckpoint : Entity<Guid>
{
    public string TenantId { get; private set; } = default!;
    public string EntityType { get; private set; } = default!;
    public string LastSuccessCursor { get; private set; } = default!;
    public DateTime LastSyncedAt { get; private set; }

    private ErpSyncCheckpoint()
    {
    }

    public static ErpSyncCheckpoint Create(string tenantId, string entityType, string lastSuccessCursor, DateTime lastSyncedAt)
    {
        return new ErpSyncCheckpoint
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EntityType = entityType,
            LastSuccessCursor = lastSuccessCursor,
            LastSyncedAt = lastSyncedAt
        };
    }

    public void MoveCursor(string lastSuccessCursor, DateTime lastSyncedAt)
    {
        LastSuccessCursor = lastSuccessCursor;
        LastSyncedAt = lastSyncedAt;
    }
}
