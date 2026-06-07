using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Layout.Commands.DeleteWarehouseRoute;

public record DeleteWarehouseRouteCommand(Guid Id) : IRequest<Result<bool>>;

public class DeleteWarehouseRouteHandler : IRequestHandler<DeleteWarehouseRouteCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteWarehouseRouteHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteWarehouseRouteCommand request, CancellationToken cancellationToken)
    {
        var route = await _context.WarehouseRoutes
            .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

        if (route == null)
        {
            return Result<bool>.Failure(new Error("Route.NotFound", $"Warehouse route {request.Id} not found."));
        }

        _context.WarehouseRoutes.Remove(route);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
