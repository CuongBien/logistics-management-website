using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inventory.Commands.CreateInventoryItem;

internal sealed class CreateInventoryItemHandler(
    IApplicationDbContext context,
    ILogger<CreateInventoryItemHandler> logger
    ) : IRequestHandler<CreateInventoryItemCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateInventoryItemCommand request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Creating new InventoryItem for SKU: {Sku}", request.Sku);

        // Check if SKU exists
        var exists = await context.InventoryItems
            .AnyAsync(x => x.Sku == request.Sku, cancellationToken);
        
        if (exists)
        {
            return Result<Guid>.Failure(DomainErrors.Inventory.SkuAlreadyExists(request.Sku));
        }

        // Create Entity
        var entity = InventoryItem.Create(request.Sku, request.Quantity);

        // Save
        context.InventoryItems.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation("InventoryItem created successfully with ID: {Id}", entity.Id);

        return Result<Guid>.Success(entity.Id);
    }
}
