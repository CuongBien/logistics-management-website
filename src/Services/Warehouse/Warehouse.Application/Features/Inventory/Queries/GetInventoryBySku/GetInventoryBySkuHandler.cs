using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Inventory.Dtos;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryBySku;

internal sealed class GetInventoryBySkuHandler(
    IApplicationDbContext context
    ) : IRequestHandler<GetInventoryBySkuQuery, Result<InventoryItemDto>>
{
    public async Task<Result<InventoryItemDto>> Handle(GetInventoryBySkuQuery request, CancellationToken cancellationToken)
    {
        var entity = await context.InventoryItems
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Sku == request.Sku, cancellationToken);

        if (entity == null)
        {
            return Result<InventoryItemDto>.Failure(DomainErrors.Inventory.NotFound(request.Sku));
        }

        return Result<InventoryItemDto>.Success(new InventoryItemDto(
            entity.Id,
            entity.Sku,
            entity.QuantityOnHand,
            entity.ReservedQty,
            entity.AvailableQty,
            entity.LastRestockedAt
        ));
    }
}
