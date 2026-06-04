using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Dashboard.Queries.GetTopMovingSkus;

public class GetTopMovingSkusQueryHandler : IRequestHandler<GetTopMovingSkusQuery, Result<List<TopMovingSkuDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetTopMovingSkusQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<TopMovingSkuDto>>> Handle(GetTopMovingSkusQuery request, CancellationToken cancellationToken)
    {
        // Simple heuristic: count occurrences in InventoryTransactions over the last 7 days.
        var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

        var query = _context.InventoryLedgers.AsNoTracking().Where(t => t.OccurredAt >= sevenDaysAgo);
        if (request.WarehouseId.HasValue) query = query.Where(t => t.WarehouseId == request.WarehouseId.Value);

        var ledgers = await query
            .Select(t => new { t.Sku, t.DeltaQty })
            .ToListAsync(cancellationToken);

        var topSkus = ledgers
            .GroupBy(t => t.Sku)
            .Select(g => new TopMovingSkuDto(
                g.Key,
                g.Sum(x => Math.Abs(x.DeltaQty))
            ))
            .OrderByDescending(x => x.TotalMovement)
            .Take(5)
            .ToList();

        return Result<List<TopMovingSkuDto>>.Success(topSkus);
    }
}
