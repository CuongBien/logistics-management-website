using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Layout.Commands.UpdateBinStatus;

public record UpdateBinStatusCommand(
    Guid BinId,
    BinStatus NewStatus,
    string OperatorId
) : IRequest<Result<bool>>;

public class UpdateBinStatusCommandHandler : IRequestHandler<UpdateBinStatusCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IOperatorAuthorizationService _authService;

    public UpdateBinStatusCommandHandler(IApplicationDbContext context, IOperatorAuthorizationService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(UpdateBinStatusCommand request, CancellationToken cancellationToken)
    {
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .FirstOrDefaultAsync(b => b.Id == request.BinId, cancellationToken);

        if (bin == null)
            return Result<bool>.Failure(new Error("Bin.NotFound", $"Bin {request.BinId} not found."));

        // Use layout:manage permission or a specific inventory/bin permission. We will use layout:manage for simplicity here.
        if (!await _authService.HasPermissionAsync(request.OperatorId, bin.WarehouseId, bin.ZoneId, "layout:manage", cancellationToken))
            return Result<bool>.Failure(new Error("Forbidden", $"Operator does not have permission to manage this bin."));

        bin.UpdateStatus(request.NewStatus);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
