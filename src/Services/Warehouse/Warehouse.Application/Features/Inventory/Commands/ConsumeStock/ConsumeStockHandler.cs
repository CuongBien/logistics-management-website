using Logistics.Core;
using MediatR;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Commands.ConsumeStock;

public class ConsumeStockHandler : IRequestHandler<ConsumeStockCommand, Result<bool>>
{
    private readonly IInventoryService _inventoryService;
    private readonly IOperatorAuthorizationService _authService;

    public ConsumeStockHandler(
        IInventoryService inventoryService,
        IOperatorAuthorizationService authService)
    {
        _inventoryService = inventoryService;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(ConsumeStockCommand request, CancellationToken cancellationToken)
    {
        // 1. RBAC Check
        var isAuthorized = await _authService.HasPermissionAsync(
            request.OperatorSub ?? string.Empty,
            request.WarehouseId,
            null,
            "inventory:consume",
            cancellationToken);

        if (!isAuthorized)
            return Result<bool>.Failure(new Error("Forbidden", "You do not have permission to consume inventory."));

        // 2. Perform Consume
        var success = await _inventoryService.ConsumeAsync(request.ReservationId, cancellationToken);

        if (!success)
            return Result<bool>.Failure(new Error("Inventory.ConsumeFailed", "Reservation not found, expired, or already processed."));

        return Result<bool>.Success(true);
    }
}
