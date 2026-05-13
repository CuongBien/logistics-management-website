using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Warehouse.Infrastructure.Inventory;

public class ExpiredReservationCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredReservationCleanupWorker> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public ExpiredReservationCleanupWorker(
        IServiceProvider serviceProvider, 
        ILogger<ExpiredReservationCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExpiredReservationCleanupWorker starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredReservationsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred during expired reservations cleanup.");
            }

            await Task.Delay(_checkInterval, stoppingToken);
        }

        _logger.LogInformation("ExpiredReservationCleanupWorker stopping...");
    }

    private async Task CleanupExpiredReservationsAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();
        var inventoryService = scope.ServiceProvider.GetRequiredService<IInventoryService>();

        var expiredReservations = await context.InventoryReservations
            .Where(r => r.Status == ReservationStatus.Active && r.ExpiresAt < DateTime.UtcNow)
            .Take(100) // Process in batches
            .ToListAsync(stoppingToken);

        if (expiredReservations.Any())
        {
            _logger.LogInformation("Found {Count} expired reservations to clean up.", expiredReservations.Count);

            foreach (var reservation in expiredReservations)
            {
                try
                {
                    // Cast to implementation if needed, or update interface to include ExpireAsync
                    if (inventoryService is InventoryService service)
                    {
                        await service.ExpireAsync(reservation.Id, stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to expire reservation {ReservationId}.", reservation.Id);
                }
            }
        }
    }
}
