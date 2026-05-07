using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Infrastructure.Inventory;

public class InventoryService : IInventoryService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<InventoryService> _logger;
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(30);

    public InventoryService(IApplicationDbContext context, ILogger<InventoryService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Guid> ReserveAsync(
        string tenantId,
        Guid warehouseId,
        string sku,
        int quantity,
        string referenceId,
        ReservationType referenceType,
        string? operatorSub = null,
        string? correlationId = null,
        CancellationToken cancellationToken = default)
    {
        // 1. Idempotency Check
        if (!string.IsNullOrWhiteSpace(correlationId))
        {
            var existing = await _context.InventoryReservations
                .FirstOrDefaultAsync(r => r.CorrelationId == correlationId, cancellationToken);

            if (existing != null)
            {
                _logger.LogInformation("Idempotent reserve: existing reservation found for CorrelationId {CorrelationId}", correlationId);
                return existing.Id;
            }
        }

        const int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                var inventoryItem = await _context.InventoryItems
                    .Where(x => x.TenantId == tenantId && x.WarehouseId == warehouseId && x.Sku == sku)
                    .Where(x => x.QuantityOnHand - x.ReservedQty >= quantity)
                    .OrderByDescending(x => x.QuantityOnHand - x.ReservedQty)
                    .FirstOrDefaultAsync(cancellationToken);

                if (inventoryItem == null)
                    throw new InsufficientStockException($"Insufficient stock for SKU {sku} in warehouse {warehouseId}");

                // 2. Update Snapshot
                inventoryItem.ReserveStock(quantity);

                // 3. Create Reservation
                var reservation = InventoryReservation.Create(
                    inventoryItem.Id,
                    referenceId,
                    referenceType,
                    quantity,
                    DefaultTtl,
                    correlationId);

                _context.InventoryReservations.Add(reservation);

                // 4. Log to Ledger
                var ledger = InventoryLedger.Create(
                    inventoryItem,
                    InventoryLedgerReason.Reserve,
                    0,
                    referenceId,
                    referenceType.ToString(),
                    operatorSub,
                    correlationId);

                _context.InventoryLedgers.Add(ledger);
                
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Stock reserved successfully for SKU: {Sku} (attempt {Attempt})", sku, attempt);
                return reservation.Id;
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogWarning(ex, "Concurrency conflict for SKU: {Sku} on attempt {Attempt}", sku, attempt);
                if (attempt == maxRetries) throw;
                
                // Tránh các transaction dở dang trong context nếu có
                _context.ChangeTracker.Clear();
                
                await Task.Delay(50 * attempt, cancellationToken);
            }
        }

        throw new InvalidOperationException("Failed to reserve stock after retries");
    }

    public async Task<bool> ReleaseAsync(Guid reservationId, string? operatorSub = null, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .FirstOrDefaultAsync(x => x.Id == reservationId, cancellationToken);

        if (reservation == null) return false;

        if (reservation.Status == ReservationStatus.Released || reservation.Status == ReservationStatus.Expired)
            return true;

        if (reservation.Status == ReservationStatus.Consumed)
            return false;

        if (reservation.MarkAsReleased())
        {
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);

            var ledger = InventoryLedger.Create(
                reservation.InventoryItem,
                InventoryLedgerReason.Release,
                0,
                reservation.ReferenceId,
                reservation.ReferenceType.ToString(),
                operatorSub,
                reservation.CorrelationId);

            _context.InventoryLedgers.Add(ledger);

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }

    public async Task<bool> ConsumeAsync(Guid reservationId, string? operatorSub = null, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .FirstOrDefaultAsync(x => x.Id == reservationId, cancellationToken);

        if (reservation == null) return false;

        if (reservation.Status == ReservationStatus.Consumed)
            return true;

        if (reservation.Status != ReservationStatus.Active)
            return false;

        if (reservation.MarkAsConsumed())
        {
            reservation.InventoryItem.ConsumeStock(reservation.Quantity);

            var ledger = InventoryLedger.Create(
                reservation.InventoryItem,
                InventoryLedgerReason.Ship,
                -reservation.Quantity,
                reservation.ReferenceId,
                reservation.ReferenceType.ToString(),
                operatorSub,
                reservation.CorrelationId);

            _context.InventoryLedgers.Add(ledger);

            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }

    public async Task ExpireAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .FirstOrDefaultAsync(x => x.Id == reservationId, cancellationToken);

        if (reservation == null) return;

        if (reservation.MarkAsExpired())
        {
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);

            var ledger = InventoryLedger.Create(
                reservation.InventoryItem,
                InventoryLedgerReason.Expired,
                0,
                reservation.ReferenceId,
                reservation.ReferenceType.ToString(),
                "system-worker",
                reservation.CorrelationId);

            _context.InventoryLedgers.Add(ledger);

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
