using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Errors;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Application.Features.Inventory.Commands.ReserveStock;

internal sealed class ReserveStockHandler(
    IApplicationDbContext context,
    ILogger<ReserveStockHandler> logger
    ) : IRequestHandler<ReserveStockCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ReserveStockCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Reserving stock for SKU: {Sku}, Quantity: {Qty}", request.Sku, request.Quantity);

        // Idempotency: if CorrelationId provided and a reservation exists, return success (avoid duplicate)
        if (!string.IsNullOrWhiteSpace(request.CorrelationId))
        {
            var existing = await context.InventoryReservations
                .FirstOrDefaultAsync(r => r.CorrelationId == request.CorrelationId, cancellationToken);

            if (existing != null)
            {
                logger.LogInformation("Idempotent reserve: existing reservation found for CorrelationId {CorrelationId}", request.CorrelationId);
                return Result<bool>.Success(true);
            }
        }

        const int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            var entity = await context.InventoryItems
                .FirstOrDefaultAsync(x => x.Sku == request.Sku, cancellationToken);

            if (entity == null)
            {
                return Result<bool>.Failure(DomainErrors.Inventory.NotFound(request.Sku));
            }

            try
            {
                // Domain action
                entity.ReserveStock(request.Quantity);

                // Create reservation
                var reservation = InventoryReservation.Create(Guid.Empty, entity.Id, request.Quantity);
                if (!string.IsNullOrWhiteSpace(request.CorrelationId))
                {
                    reservation.SetCorrelation("Command", null, request.CorrelationId);
                }
                context.InventoryReservations.Add(reservation);

                await context.SaveChangesAsync(cancellationToken);

                logger.LogInformation("Stock reserved successfully for SKU: {Sku} (attempt {Attempt})", request.Sku, attempt);
                return Result<bool>.Success(true);
            }
            catch (InsufficientStockException ex)
            {
                logger.LogWarning(ex, "Insufficient stock for SKU: {Sku}", request.Sku);
                return Result<bool>.Failure(DomainErrors.Inventory.InsufficientStock(request.Sku));
            }
            catch (DbUpdateConcurrencyException ex)
            {
                logger.LogWarning(ex, "Concurrency conflict for SKU: {Sku} on attempt {Attempt}", request.Sku, attempt);
                if (attempt == maxRetries)
                {
                    return Result<bool>.Failure(new Error("Inventory.ConcurrencyConflict", "The inventory was modified by another transaction. Please retry."));
                }
                // small delay before retry
                await Task.Delay(50 * attempt, cancellationToken);
                continue; // retry
            }
        }

        return Result<bool>.Failure(new Error("Inventory.Failed", "Failed to reserve stock"));
    }
}
