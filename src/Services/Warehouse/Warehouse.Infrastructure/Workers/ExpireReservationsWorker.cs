using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Workers;

public class ExpireReservationsWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpireReservationsWorker> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(1); // configurable

    public ExpireReservationsWorker(IServiceProvider serviceProvider, ILogger<ExpireReservationsWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExpireReservationsWorker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

                // Query active reservations expired
                var now = DateTime.UtcNow;
                var expired = await context.InventoryReservations
                    .Where(r => r.Status == InventoryReservationStatus.Active && r.ExpiresAt <= now)
                    .ToListAsync(stoppingToken);

                if (expired.Count > 0)
                {
                    _logger.LogInformation("Found {Count} expired reservations", expired.Count);

                    foreach (var res in expired)
                    {
                        // Load InventoryItem
                        var item = await context.InventoryItems.FirstOrDefaultAsync(i => i.Id == res.InventoryItemId, stoppingToken);
                        if (item == null)
                        {
                            _logger.LogWarning("InventoryItem {ItemId} not found for reservation {ReservationId}", res.InventoryItemId, res.Id);
                            continue;
                        }

                        // Mark expired and release reserved qty
                        res.MarkExpired();
                        item.ReleaseReservation(res.ReservedQty);

                        // add ledger entry
                        try
                        {
                            var ledger = InventoryLedger.Create(item.Sku, item.WarehouseId, item.BinId, -res.ReservedQty, InventoryLedgerReason.Expired, "ExpireJob", res.Id.ToString(), null);
                            // need concrete WMSDbContext to add ledger set; use IApplicationDbContext if it exposes
                            var wms = scope.ServiceProvider.GetRequiredService<Warehouse.Infrastructure.Persistence.WMSDbContext>();
                            wms.InventoryLedger.Add(ledger);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to create ledger for expired reservation {ReservationId}", res.Id);
                        }
                    }

                    await context.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while expiring reservations");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }
}
