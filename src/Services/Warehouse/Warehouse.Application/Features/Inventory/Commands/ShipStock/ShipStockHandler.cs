using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Commands.ShipStock;

internal sealed class ShipStockHandler(
    IApplicationDbContext context,
    ILogger<ShipStockHandler> logger
    ) : IRequestHandler<ShipStockCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ShipStockCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Consuming reservation {ReservationId} Quantity {Quantity}", request.ReservationId, request.Quantity);

        var reservation = await context.InventoryReservations
            .FirstOrDefaultAsync(r => r.Id == request.ReservationId, cancellationToken);

        if (reservation == null)
        {
            return Result<bool>.Failure(new Error("Inventory.ReservationNotFound", "Reservation not found"));
        }

        if (reservation.Status != InventoryReservationStatus.Active)
        {
            return Result<bool>.Failure(new Error("Inventory.ReservationNotActive", "Reservation is not active"));
        }

        // Load inventory item
        var item = await context.InventoryItems.FirstOrDefaultAsync(i => i.Id == reservation.InventoryItemId, cancellationToken);
        if (item == null)
        {
            return Result<bool>.Failure(new Error("Inventory.ItemNotFound", "Inventory item not found"));
        }

        try
        {
            // Domain-level consume
            item.ConsumeReserved(request.Quantity);

            // mark reservation consumed (could be partial; for simplicity assume full consume equals reserved qty)
            reservation.MarkConsumed();

            // write ledger entry for ship
            var ledger = InventoryLedger.Create(item.Sku, item.WarehouseId, item.BinId, -request.Quantity, InventoryLedgerReason.Ship, "Ship", reservation.Id.ToString(), request.CorrelationId);
            context.InventoryLedger.Add(ledger);

            await context.SaveChangesAsync(cancellationToken);

            return Result<bool>.Success(true);
        }
        catch (InsufficientStockException ex)
        {
            logger.LogWarning(ex, "Insufficient stock while consuming reservation {ReservationId}", request.ReservationId);
            return Result<bool>.Failure(Domain.Errors.DomainErrors.Inventory.InsufficientStock(item.Sku));
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation while consuming reservation {ReservationId}", request.ReservationId);
            return Result<bool>.Failure(new Error("Inventory.InvalidOperation", ex.Message));
        }
        catch (DbUpdateConcurrencyException ex)
        {
            logger.LogWarning(ex, "Concurrency error while consuming reservation {ReservationId}", request.ReservationId);
            return Result<bool>.Failure(new Error("Inventory.ConcurrencyConflict", "The inventory was modified by another transaction. Please retry."));
        }
    }
}
