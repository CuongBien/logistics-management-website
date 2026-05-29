using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inbound.Commands.ResolveInboundDiscrepancy;

public record ResolveInboundDiscrepancyCommand(
    Guid DiscrepancyId, 
    InboundDiscrepancyStatus NewStatus, 
    string OperatorId, 
    string? ResolutionNotes) : IRequest<Result>;

public class ResolveInboundDiscrepancyCommandHandler : IRequestHandler<ResolveInboundDiscrepancyCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IOperatorAuthorizationService _authService;

    public ResolveInboundDiscrepancyCommandHandler(
        IApplicationDbContext context,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task<Result> Handle(ResolveInboundDiscrepancyCommand request, CancellationToken cancellationToken)
    {
        var discrepancy = await _context.InboundDiscrepancies
            .FirstOrDefaultAsync(d => d.Id == request.DiscrepancyId, cancellationToken);

        if (discrepancy == null)
            return Result.Failure(new Error("InboundDiscrepancy.NotFound", $"InboundDiscrepancy with Id {request.DiscrepancyId} not found."));

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            discrepancy.WarehouseId,
            null,
            "inbound:resolve_discrepancy",
            cancellationToken);

        if (!hasPermission)
        {
            return Result.Failure(new Error(
                "Operator.Forbidden",
                $"Operator '{request.OperatorId}' does not have permission 'inbound:resolve_discrepancy' for warehouse '{discrepancy.WarehouseId}'."));
        }

        try
        {
            discrepancy.Resolve(request.NewStatus, request.ResolutionNotes);
            await _context.SaveChangesAsync(cancellationToken);
            return Result.Success();
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(new Error("InboundDiscrepancy.InvalidState", ex.Message));
        }
    }
}
