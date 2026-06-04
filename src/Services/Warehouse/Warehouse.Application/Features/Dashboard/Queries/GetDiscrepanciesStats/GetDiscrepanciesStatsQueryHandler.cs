using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Dashboard.Queries.GetDiscrepanciesStats;

public class GetDiscrepanciesStatsQueryHandler : IRequestHandler<GetDiscrepanciesStatsQuery, Result<DiscrepanciesStatsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetDiscrepanciesStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<DiscrepanciesStatsDto>> Handle(GetDiscrepanciesStatsQuery request, CancellationToken cancellationToken)
    {
        var inboundQuery = _context.InboundDiscrepancies.AsNoTracking().Where(d => d.Status != InboundDiscrepancyStatus.Resolved);
        if (request.WarehouseId.HasValue) inboundQuery = inboundQuery.Where(d => d.WarehouseId == request.WarehouseId.Value);
        var unresolvedInbound = await inboundQuery.CountAsync(cancellationToken);

        var transitQuery = _context.TransitDiscrepancies.AsNoTracking().Where(d => d.Status != TransitDiscrepancyStatus.Resolved);
        // Assuming TransitDiscrepancy does not have WarehouseId directly or we don't filter it if it doesn't.
        // Actually TransitDiscrepancies might not have WarehouseId.
        var unresolvedTransit = await transitQuery.CountAsync(cancellationToken);

        var dto = new DiscrepanciesStatsDto(unresolvedInbound, unresolvedTransit);

        return Result<DiscrepanciesStatsDto>.Success(dto);
    }
}
