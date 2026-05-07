using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Infrastructure.Inventory;

public class InventoryService : IInventoryService
{
    private readonly IApplicationDbContext _context;
    private static readonly TimeSpan DefaultTtl = TimeSpan.FromMinutes(30);

    public InventoryService(IApplicationDbContext context)
    {
        _context = context;
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
        var inventoryItem = await _context.InventoryItems
            .Where(x => x.TenantId == tenantId && x.WarehouseId == warehouseId && x.Sku == sku)
            .Where(x => x.QuantityOnHand - x.ReservedQty >= quantity)
            .OrderByDescending(x => x.QuantityOnHand - x.ReservedQty)
            .FirstOrDefaultAsync(cancellationToken);

        if (inventoryItem == null)
            throw new InvalidOperationException($"Insufficient stock for SKU {sku} in warehouse {warehouseId}");

        // 1. Update InventoryItem (Snapshot)
        inventoryItem.ReserveStock(quantity);

        // 2. Create Reservation
        var reservation = InventoryReservation.Create(
            inventoryItem.Id,
            referenceId,
            referenceType,
            quantity,
            DefaultTtl,
            correlationId);

        _context.InventoryReservations.Add(reservation);

        // 3. Log to Ledger (Type: Reservation, Change: 0 physical)
        var ledger = InventoryLedger.Create(
            inventoryItem.Id,
            InventoryTransactionType.Reservation,
            0,
            inventoryItem.QuantityOnHand,
            referenceId,
            operatorSub,
            correlationId);

        _context.InventoryLedgers.Add(ledger);
        
        await _context.SaveChangesAsync(cancellationToken);

        return reservation.Id;
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
            // 1. Update Snapshot
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);

            // 2. Log to Ledger (Type: Release, Change: 0 physical)
            var ledger = InventoryLedger.Create(
                reservation.InventoryItemId,
                InventoryTransactionType.Release,
                0,
                reservation.InventoryItem.QuantityOnHand,
                reservation.ReferenceId,
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
            // 1. Update Snapshot
            reservation.InventoryItem.ConsumeStock(reservation.Quantity);

            // 2. Log to Ledger (Type: Outbound, Change: -Quantity)
            var ledger = InventoryLedger.Create(
                reservation.InventoryItemId,
                InventoryTransactionType.Outbound,
                -reservation.Quantity,
                reservation.InventoryItem.QuantityOnHand,
                reservation.ReferenceId,
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
            // 1. Update Snapshot
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);

            // 2. Log to Ledger (Type: Expired, Change: 0 physical)
            var ledger = InventoryLedger.Create(
                reservation.InventoryItemId,
                InventoryTransactionType.Expired,
                0,
                reservation.InventoryItem.QuantityOnHand,
                reservation.ReferenceId,
                "system-worker",
                reservation.CorrelationId);

            _context.InventoryLedgers.Add(ledger);

            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
