using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Layout.Commands.CreateWarehouseRoute;

public record CreateWarehouseRouteCommand(
    Guid SourceWarehouseId,
    Guid DestinationWarehouseId,
    Guid NextHopWarehouseId) : IRequest<Result<Guid>>;

public class CreateWarehouseRouteHandler : IRequestHandler<CreateWarehouseRouteCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateWarehouseRouteHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateWarehouseRouteCommand request, CancellationToken cancellationToken)
    {
        // Validate source, destination and next-hop are distinct
        if (request.SourceWarehouseId == request.DestinationWarehouseId)
        {
            return Result<Guid>.Failure(new Error("Route.Invalid", "Source and destination warehouses must be different."));
        }

        // Check if route already exists
        var exists = await _context.WarehouseRoutes.AnyAsync(r => 
            r.SourceWarehouseId == request.SourceWarehouseId && 
            r.DestinationWarehouseId == request.DestinationWarehouseId, 
            cancellationToken);

        if (exists)
        {
            return Result<Guid>.Failure(new Error("Route.Exists", "A routing configuration for this source-destination pair already exists."));
        }

        // Validate warehouses exist
        var whIds = new[] { request.SourceWarehouseId, request.DestinationWarehouseId, request.NextHopWarehouseId };
        var existingCount = await _context.Warehouses.CountAsync(w => whIds.Contains(w.Id), cancellationToken);
        if (existingCount < whIds.Distinct().Count())
        {
            return Result<Guid>.Failure(new Error("Warehouse.NotFound", "One or more warehouses specified in the route do not exist."));
        }

        var route = new WarehouseRoute(
            request.SourceWarehouseId,
            request.DestinationWarehouseId,
            request.NextHopWarehouseId);

        _context.WarehouseRoutes.Add(route);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(route.Id);
    }
}
