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

        var entity = await context.InventoryItems
            .FirstOrDefaultAsync(x => x.Sku == request.Sku, cancellationToken);
            
        if (entity == null)
        {
            return Result<bool>.Failure(DomainErrors.Inventory.NotFound(request.Sku));
        }

        try
        {
            // Domain Logic
            entity.ReserveStock(request.Quantity);

            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Stock reserved successfully for SKU: {Sku}", request.Sku);

            return Result<bool>.Success(true);
        }
        catch (InsufficientStockException ex)
        {
            logger.LogWarning(ex, "Insufficient stock for SKU: {Sku}", request.Sku);
            return Result<bool>.Failure(DomainErrors.Inventory.InsufficientStock(request.Sku));
        }
        catch (DbUpdateConcurrencyException ex)
        {
             logger.LogWarning(ex, "Concurrency conflict for SKU: {Sku}", request.Sku);
             // In real world, we might retry or return a specific concurrency error
             return Result<bool>.Failure(new Error("Inventory.ConcurrencyConflict", "The inventory was modified by another transaction. Please retry."));
        }
    }
}
