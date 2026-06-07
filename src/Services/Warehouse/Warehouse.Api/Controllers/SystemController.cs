using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Infrastructure.Persistence;
using Warehouse.Infrastructure.ErpSync;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SystemController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IServiceProvider _serviceProvider;
    private readonly ErpSyncOptions _options;

    public SystemController(
        IApplicationDbContext context,
        IServiceProvider serviceProvider,
        IOptions<ErpSyncOptions> options)
    {
        _context = context;
        _serviceProvider = serviceProvider;
        _options = options.Value;
    }

    [HttpGet("sync-checkpoints")]
    public async Task<IActionResult> GetSyncCheckpoints()
    {
        var checkpoints = await _context.ErpSyncCheckpoints
            .AsNoTracking()
            .Select(c => new
            {
                c.Id,
                c.TenantId,
                c.EntityType,
                c.LastSuccessCursor,
                c.LastSyncedAt
            })
            .ToListAsync();

        return Ok(checkpoints);
    }

    [HttpPost("sync-checkpoints/trigger")]
    public IActionResult TriggerSync()
    {
        // Run sync asynchronously in the background so it doesn't block the HTTP request
        _ = Task.Run(async () =>
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<WMSDbContext>();
            var client = scope.ServiceProvider.GetRequiredService<IErpMasterDataClient>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<SystemController>>();

            foreach (var tenantId in _options.TenantIds)
            {
                try
                {
                    logger.LogInformation("Manual ERP sync triggered for tenant {TenantId}", tenantId);
                    
                    // Sync SKUs
                    var skuCheckpoint = await db.ErpSyncCheckpoints
                        .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.EntityType == "sku");
                    if (skuCheckpoint == null)
                    {
                        skuCheckpoint = Domain.Entities.ErpSyncCheckpoint.Create(tenantId, "sku", string.Empty, DateTime.MinValue);
                        db.ErpSyncCheckpoints.Add(skuCheckpoint);
                        await db.SaveChangesAsync();
                    }

                    var skuPage = await client.GetSkusAsync(tenantId, skuCheckpoint.LastSuccessCursor, _options.BatchSize, CancellationToken.None);
                    var syncedAt = DateTime.UtcNow;
                    foreach (var sku in skuPage.Items)
                    {
                        var existing = await db.ErpSkuMirrors
                            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ErpSkuId == sku.ErpSkuId);

                        if (existing is null)
                        {
                            db.ErpSkuMirrors.Add(Domain.Entities.ErpSkuMirror.Create(
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
                    skuCheckpoint.MoveCursor(skuPage.NextCursor, syncedAt);
                    await db.SaveChangesAsync();

                    // Sync Warehouses
                    var whCheckpoint = await db.ErpSyncCheckpoints
                        .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.EntityType == "warehouse");
                    if (whCheckpoint == null)
                    {
                        whCheckpoint = Domain.Entities.ErpSyncCheckpoint.Create(tenantId, "warehouse", string.Empty, DateTime.MinValue);
                        db.ErpSyncCheckpoints.Add(whCheckpoint);
                        await db.SaveChangesAsync();
                    }

                    var whPage = await client.GetWarehousesAsync(tenantId, whCheckpoint.LastSuccessCursor, _options.BatchSize, CancellationToken.None);
                    foreach (var warehouse in whPage.Items)
                    {
                        var existing = await db.ErpWarehouseMirrors
                            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ErpWarehouseId == warehouse.ErpWarehouseId);

                        if (existing is null)
                        {
                            db.ErpWarehouseMirrors.Add(Domain.Entities.ErpWarehouseMirror.Create(
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
                    whCheckpoint.MoveCursor(whPage.NextCursor, syncedAt);
                    await db.SaveChangesAsync();

                    logger.LogInformation("Manual ERP sync completed successfully for tenant {TenantId}", tenantId);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Manual ERP sync failed for tenant {TenantId}", tenantId);
                }
            }
        });

        return Ok(new { Message = "Đã kích hoạt tiến trình đồng bộ ERP ngầm (ERP Sync Process triggered asynchronously)." });
    }
}
