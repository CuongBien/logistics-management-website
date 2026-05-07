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

        // 3. Log to Ledger (Reason: Reserve, Delta: 0)
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

            // 2. Log to Ledger (Reason: Release, Delta: 0)
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
            // 1. Update Snapshot
            reservation.InventoryItem.ConsumeStock(reservation.Quantity);

            // 2. Log to Ledger (Reason: Ship, Delta: -Quantity)
            // Lưu ý: Chúng ta dùng 'Ship' cho Consume thực tế của đơn hàng
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
            // 1. Update Snapshot
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);

            // 2. Log to Ledger (Reason: Expired, Delta: 0)
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
