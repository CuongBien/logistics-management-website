using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Dashboard.Queries.GetInventoryStats;

public class GetInventoryStatsQueryHandler : IRequestHandler<GetInventoryStatsQuery, Result<InventoryStatsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetInventoryStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<InventoryStatsDto>> Handle(GetInventoryStatsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.InventoryItems.AsNoTracking();
        if (request.WarehouseId.HasValue)
        {
            query = query.Where(i => i.WarehouseId == request.WarehouseId.Value);
        }

        var totalQuantity = await query
            .SumAsync(i => i.QuantityOnHand, cancellationToken);

        var totalUniqueSkus = await query
            .Select(i => i.Sku)
            .Distinct()
            .CountAsync(cancellationToken);

        var dto = new InventoryStatsDto(
            totalUniqueSkus,
            totalQuantity
        );

        return Result<InventoryStatsDto>.Success(dto);
    }
}
