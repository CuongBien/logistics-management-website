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
        var unresolvedInbound = await _context.InboundDiscrepancies
            .AsNoTracking()
            .CountAsync(d => d.Status != InboundDiscrepancyStatus.Resolved, cancellationToken);

        var unresolvedTransit = await _context.TransitDiscrepancies
            .AsNoTracking()
            .CountAsync(d => d.Status != TransitDiscrepancyStatus.Resolved, cancellationToken);

        var dto = new DiscrepanciesStatsDto(unresolvedInbound, unresolvedTransit);

        return Result<DiscrepanciesStatsDto>.Success(dto);
    }
}
