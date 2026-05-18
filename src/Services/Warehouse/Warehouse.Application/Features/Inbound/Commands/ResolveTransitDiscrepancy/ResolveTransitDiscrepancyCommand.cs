using MediatR;
using Microsoft.EntityFrameworkCore;
using Logistics.Core;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Warehouse.Application.Features.Inbound.Commands.ResolveTransitDiscrepancy;

public record ResolveTransitDiscrepancyCommand(
    Guid DiscrepancyId,
    TransitDiscrepancyStatus NewStatus,
    string OperatorId,
    string? Notes = null
) : IRequest<Result<bool>>;

public class ResolveTransitDiscrepancyCommandHandler : IRequestHandler<ResolveTransitDiscrepancyCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IOperatorAuthorizationService _authService;

    public ResolveTransitDiscrepancyCommandHandler(IApplicationDbContext context, IOperatorAuthorizationService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(ResolveTransitDiscrepancyCommand request, CancellationToken cancellationToken)
    {
        var discrepancy = await _context.TransitDiscrepancies
            .FirstOrDefaultAsync(x => x.Id == request.DiscrepancyId, cancellationToken);

        if (discrepancy == null)
        {
            return Result<bool>.Failure(Error.NotFound("TransitDiscrepancy.NotFound", $"Transit Discrepancy report {request.DiscrepancyId} not found."));
        }

        // Perform RBAC check
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            discrepancy.WarehouseId,
            null,
            "inbound:resolve_discrepancy",
            cancellationToken);

        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inbound:resolve_discrepancy' for warehouse '{discrepancy.WarehouseId}'."));
        }

        discrepancy.Resolve(request.NewStatus, request.Notes);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
