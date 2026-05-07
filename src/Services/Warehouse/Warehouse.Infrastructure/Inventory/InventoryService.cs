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
        string? correlationId = null,
        CancellationToken cancellationToken = default)
    {
        // Simple bin selection: First bin with enough available stock
        var inventoryItem = await _context.InventoryItems
            .Where(x => x.TenantId == tenantId && x.WarehouseId == warehouseId && x.Sku == sku)
            .Where(x => x.QuantityOnHand - x.ReservedQty >= quantity)
            .OrderByDescending(x => x.QuantityOnHand - x.ReservedQty) // Prefer bins with more stock
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
        
        await _context.SaveChangesAsync(cancellationToken);

        return reservation.Id;
    }

    public async Task<bool> ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .FirstOrDefaultAsync(x => x.Id == reservationId, cancellationToken);

        if (reservation == null) return false;

        // Idempotency: If already released or expired, we consider it a success
        if (reservation.Status == ReservationStatus.Released || reservation.Status == ReservationStatus.Expired)
            return true;

        // If it's already consumed, we cannot release it (Business Error)
        if (reservation.Status == ReservationStatus.Consumed)
            return false;

        if (reservation.MarkAsReleased())
        {
            // Update Snapshot
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }

    public async Task<bool> ConsumeAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .FirstOrDefaultAsync(x => x.Id == reservationId, cancellationToken);

        if (reservation == null) return false;

        // Idempotency: If already consumed, it's a success
        if (reservation.Status == ReservationStatus.Consumed)
            return true;

        // If it's released or expired, we cannot consume it
        if (reservation.Status != ReservationStatus.Active)
            return false;

        if (reservation.MarkAsConsumed())
        {
            // Update Snapshot (Deduct from both OnHand and Reserved)
            reservation.InventoryItem.ConsumeStock(reservation.Quantity);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }

        return false;
    }

    // Internal helper for background job
    public async Task ExpireAsync(Guid reservationId, CancellationToken cancellationToken = default)
    {
        var reservation = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .FirstOrDefaultAsync(x => x.Id == reservationId, cancellationToken);

        if (reservation == null) return;

        if (reservation.MarkAsExpired())
        {
            reservation.InventoryItem.ReleaseStock(reservation.Quantity);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}
