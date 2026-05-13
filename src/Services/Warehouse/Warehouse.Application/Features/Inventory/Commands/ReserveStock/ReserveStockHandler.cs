using Logistics.Core;
using MediatR;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Commands.ReserveStock;

public class ReserveStockHandler : IRequestHandler<ReserveStockCommand, Result<Guid>>
{
    private readonly IInventoryService _inventoryService;
    private readonly IOperatorAuthorizationService _authService;

    public ReserveStockHandler(
        IInventoryService inventoryService,
        IOperatorAuthorizationService authService)
    {
        _inventoryService = inventoryService;
        _authService = authService;
    }

    public async Task<Result<Guid>> Handle(ReserveStockCommand request, CancellationToken cancellationToken)
    {
        // 1. RBAC Check
        var isAuthorized = await _authService.HasPermissionAsync(
            request.OperatorSub ?? string.Empty,
            request.WarehouseId, 
            null, 
            "inventory:reserve", 
            cancellationToken);

        if (!isAuthorized)
            return Result<Guid>.Failure(new Error("Forbidden", "You do not have permission to reserve inventory."));

        // 2. Perform Reservation
        try
        {
            var reservationId = await _inventoryService.ReserveAsync(
                request.TenantId ?? string.Empty,
                request.WarehouseId,
                request.Sku,
                request.Quantity,
                request.ReferenceId,
                request.ReferenceType,
                request.OperatorSub,
                request.CorrelationId,
                cancellationToken);

            return Result<Guid>.Success(reservationId);
        }
        catch (InvalidOperationException ex)
        {
            return Result<Guid>.Failure(new Error("Inventory.InsufficientStock", ex.Message));
        }
        catch (Exception ex)
        {
            return Result<Guid>.Failure(new Error("Inventory.Error", ex.Message));
        }
    }
}
