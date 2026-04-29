using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Ordering.Domain.Entities;
using Ordering.Infrastructure.Persistence;

namespace Ordering.Infrastructure.ErpSync;

public class ErpSyncWorker : BackgroundService
{
    private const string SkuEntityType = "sku";
    private const string WarehouseEntityType = "warehouse";
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ErpSyncWorker> _logger;
    private readonly ErpSyncOptions _options;

    public ErpSyncWorker(IServiceScopeFactory scopeFactory, IOptions<ErpSyncOptions> options, ILogger<ErpSyncWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _options = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            foreach (var tenantId in _options.TenantIds)
            {
                await SyncTenantAsync(tenantId, stoppingToken);
            }

            await Task.Delay(TimeSpan.FromSeconds(_options.SyncIntervalSeconds), stoppingToken);
        }
    }

    private async Task SyncTenantAsync(string tenantId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var erpClient = scope.ServiceProvider.GetRequiredService<IErpMasterDataClient>();

        _logger.LogDebug("ERP sync started for tenant {TenantId}", tenantId);
        await SyncSkusAsync(tenantId, dbContext, erpClient, cancellationToken);
        await SyncWarehousesAsync(tenantId, dbContext, erpClient, cancellationToken);
    }

    private async Task SyncSkusAsync(string tenantId, ApplicationDbContext dbContext, IErpMasterDataClient erpClient, CancellationToken cancellationToken)
    {
        var checkpoint = await GetOrCreateCheckpointAsync(tenantId, SkuEntityType, dbContext, cancellationToken);
        var page = await erpClient.GetSkusAsync(tenantId, checkpoint.LastSuccessCursor, _options.BatchSize, cancellationToken);
        var syncedAt = DateTime.UtcNow;

        foreach (var sku in page.Items)
        {
            var existing = await dbContext.ErpSkuMirrors
                .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ErpSkuId == sku.ErpSkuId, cancellationToken);

            if (existing is null)
            {
                dbContext.ErpSkuMirrors.Add(ErpSkuMirror.Create(
                    tenantId,
                    sku.ErpSkuId,
                    sku.SkuCode,
                    sku.Name,
                    sku.UnitOfMeasure,
                    sku.Status,
                    sku.UpdatedAtErp,
                    syncedAt));
            }
            else if (sku.UpdatedAtErp >= existing.UpdatedAtErp)
            {
                existing.ApplySync(sku.Name, sku.UnitOfMeasure, sku.Status, sku.UpdatedAtErp, syncedAt);
            }
        }

        checkpoint.MoveCursor(page.NextCursor, syncedAt);
        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("ERP SKU sync completed for tenant {TenantId}. Rows={RowCount}, Cursor={Cursor}", tenantId, page.Items.Count, page.NextCursor);
    }

    private async Task SyncWarehousesAsync(string tenantId, ApplicationDbContext dbContext, IErpMasterDataClient erpClient, CancellationToken cancellationToken)
    {
        var checkpoint = await GetOrCreateCheckpointAsync(tenantId, WarehouseEntityType, dbContext, cancellationToken);
        var page = await erpClient.GetWarehousesAsync(tenantId, checkpoint.LastSuccessCursor, _options.BatchSize, cancellationToken);
        var syncedAt = DateTime.UtcNow;

        foreach (var warehouse in page.Items)
        {
            var existing = await dbContext.ErpWarehouseMirrors
                .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ErpWarehouseId == warehouse.ErpWarehouseId, cancellationToken);

            if (existing is null)
            {
                dbContext.ErpWarehouseMirrors.Add(ErpWarehouseMirror.Create(
                    tenantId,
                    warehouse.ErpWarehouseId,
                    warehouse.WarehouseCode,
                    warehouse.Name,
                    warehouse.Status,
                    warehouse.UpdatedAtErp,
                    syncedAt));
            }
            else if (warehouse.UpdatedAtErp >= existing.UpdatedAtErp)
            {
                existing.ApplySync(warehouse.Name, warehouse.Status, warehouse.UpdatedAtErp, syncedAt);
            }
        }

        checkpoint.MoveCursor(page.NextCursor, syncedAt);
        await dbContext.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("ERP warehouse sync completed for tenant {TenantId}. Rows={RowCount}, Cursor={Cursor}", tenantId, page.Items.Count, page.NextCursor);
    }

    private static async Task<ErpSyncCheckpoint> GetOrCreateCheckpointAsync(
        string tenantId,
        string entityType,
        ApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var checkpoint = await dbContext.ErpSyncCheckpoints
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.EntityType == entityType, cancellationToken);

        if (checkpoint is not null)
        {
            return checkpoint;
        }

        checkpoint = ErpSyncCheckpoint.Create(tenantId, entityType, string.Empty, DateTime.MinValue);
        dbContext.ErpSyncCheckpoints.Add(checkpoint);
        await dbContext.SaveChangesAsync(cancellationToken);
        return checkpoint;
    }
}
