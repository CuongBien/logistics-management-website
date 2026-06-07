using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryList;

public record GetInventoryListQuery(string? TenantId, Guid? WarehouseId, Guid? BinId = null) : IRequest<List<InventoryItemDto>>;

public record InventoryItemDto(
    Guid Id,
    string TenantId,
    string Sku,
    string BinCode,
    int QuantityOnHand,
    int AvailableQuantity,
    string? LotNo,
    DateTime? ExpiryDate,
    Guid WarehouseId,
    string WarehouseCode,
    string WarehouseName
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
        var itemsQuery = from i in _context.InventoryItems
                         join b in _context.Bins on i.BinId equals b.Id into binGroup
                         from bin in binGroup.DefaultIfEmpty()
                         join w in _context.Warehouses on i.WarehouseId equals w.Id into whGroup
                         from wh in whGroup.DefaultIfEmpty()
                         select new {
                             Item = i,
                             BinCode = bin != null ? bin.BinCode : i.BinId.ToString(),
                             WarehouseCode = wh != null ? wh.Code : "UNKNOWN",
                             WarehouseName = wh != null ? wh.Name : "Unknown Warehouse"
                         };

        if (!string.IsNullOrEmpty(request.TenantId))
        {
            itemsQuery = itemsQuery.Where(x => x.Item.TenantId == request.TenantId);
        }

        if (request.WarehouseId.HasValue)
        {
            itemsQuery = itemsQuery.Where(x => x.Item.WarehouseId == request.WarehouseId.Value);
        }

        if (request.BinId.HasValue)
        {
            itemsQuery = itemsQuery.Where(x => x.Item.BinId == request.BinId.Value);
        }

        var result = await itemsQuery.ToListAsync(cancellationToken);

        return result.Select(x => new InventoryItemDto(
            x.Item.Id,
            x.Item.TenantId,
            x.Item.Sku,
            x.BinCode,
            x.Item.QuantityOnHand,
            x.Item.AvailableQty,
            x.Item.LotNo,
            x.Item.ExpiryDate,
            x.Item.WarehouseId,
            x.WarehouseCode,
            x.WarehouseName
        )).ToList();
    }
}
