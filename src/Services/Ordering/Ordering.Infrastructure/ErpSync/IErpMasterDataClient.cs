namespace Ordering.Infrastructure.ErpSync;

public interface IErpMasterDataClient
{
    Task<ErpSyncPage<ErpSkuDto>> GetSkusAsync(
        string tenantId,
        string updatedAfterCursor,
        int batchSize,
        CancellationToken cancellationToken);

    Task<ErpSyncPage<ErpWarehouseDto>> GetWarehousesAsync(
        string tenantId,
        string updatedAfterCursor,
        int batchSize,
        CancellationToken cancellationToken);
}
