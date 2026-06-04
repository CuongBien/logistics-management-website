using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Layout.Queries.GetWarehouseRoutes;

public record GetWarehouseRoutesQuery : IRequest<Result<List<WarehouseRouteDto>>>;

public record WarehouseRouteDto(
    Guid Id,
    Guid SourceWarehouseId,
    Guid DestinationWarehouseId,
    Guid NextHopWarehouseId);

public class GetWarehouseRoutesHandler : IRequestHandler<GetWarehouseRoutesQuery, Result<List<WarehouseRouteDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetWarehouseRoutesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<WarehouseRouteDto>>> Handle(GetWarehouseRoutesQuery request, CancellationToken cancellationToken)
    {
        var routes = await _context.WarehouseRoutes
            .AsNoTracking()
            .Select(r => new WarehouseRouteDto(
                r.Id,
                r.SourceWarehouseId,
                r.DestinationWarehouseId,
                r.NextHopWarehouseId))
            .ToListAsync(cancellationToken);

        return Result<List<WarehouseRouteDto>>.Success(routes);
    }
}
