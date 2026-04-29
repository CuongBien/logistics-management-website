namespace Warehouse.Infrastructure.ErpSync;

public record ErpSyncOptions
{
    public string BaseUrl { get; init; } = default!;
    public string ApiKey { get; init; } = default!;
    public int BatchSize { get; init; }
    public int SyncIntervalSeconds { get; init; }
    public bool ShadowMode { get; init; }
    public bool EnforceWmsValidation { get; init; }
    public IReadOnlyCollection<string> TenantIds { get; init; } = Array.Empty<string>();
}

public record ErpSyncPage<TItem>(IReadOnlyCollection<TItem> Items, string NextCursor);

public record ErpSkuDto(
    string ErpSkuId,
    string SkuCode,
    string Name,
    string UnitOfMeasure,
    string Status,
    DateTime UpdatedAtErp);

public record ErpWarehouseDto(
    string ErpWarehouseId,
    string WarehouseCode,
    string Name,
    string Status,
    DateTime UpdatedAtErp);
