using Logistics.Core;
using MediatR;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Commands.ReleaseStock;

public class ReleaseStockHandler : IRequestHandler<ReleaseStockCommand, Result<bool>>
{
    private readonly IInventoryService _inventoryService;
    private readonly IOperatorAuthorizationService _authService;

    public ReleaseStockHandler(
        IInventoryService inventoryService,
        IOperatorAuthorizationService authService)
    {
        _inventoryService = inventoryService;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(ReleaseStockCommand request, CancellationToken cancellationToken)
    {
        // 1. RBAC Check
        var isAuthorized = await _authService.HasPermissionAsync(
            request.OperatorSub ?? string.Empty,
            request.WarehouseId,
            null,
            "inventory:release",
            cancellationToken);

        if (!isAuthorized)
            return Result<bool>.Failure(new Error("Forbidden", "You do not have permission to release inventory."));

        // 2. Perform Release
        var success = await _inventoryService.ReleaseAsync(request.ReservationId, cancellationToken);
        
        if (!success)
            return Result<bool>.Failure(new Error("Inventory.ReleaseFailed", "Reservation not found or already processed."));

        return Result<bool>.Success(true);
    }
}
