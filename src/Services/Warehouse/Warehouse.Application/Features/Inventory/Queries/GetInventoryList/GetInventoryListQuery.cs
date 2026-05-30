using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryList;

public record GetInventoryListQuery(string? TenantId, Guid? WarehouseId) : IRequest<List<InventoryItemDto>>;

public record InventoryItemDto(
    Guid Id,
    string TenantId,
    string Sku,
    string BinCode,
    int QuantityOnHand,
    int AvailableQuantity,
    string? LotNo,
    DateTime? ExpiryDate
);

public class GetInventoryListQueryHandler : IRequestHandler<GetInventoryListQuery, List<InventoryItemDto>>
{
    private readonly IApplicationDbContext _context;

    public GetInventoryListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<InventoryItemDto>> Handle(GetInventoryListQuery request, CancellationToken cancellationToken)
    {
        var query = _context.InventoryItems.AsQueryable();

        if (!string.IsNullOrEmpty(request.TenantId))
        {
            query = query.Where(i => i.TenantId == request.TenantId);
        }

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(i => i.WarehouseId == request.WarehouseId.Value);
        }

        var items = await query.ToListAsync(cancellationToken);

        return items.Select(i => new InventoryItemDto(
            i.Id,
            i.TenantId,
            i.Sku,
            i.BinId.ToString(),
            i.QuantityOnHand,
            i.AvailableQty,
            i.LotNo,
            i.ExpiryDate
        )).ToList();
    }
}
