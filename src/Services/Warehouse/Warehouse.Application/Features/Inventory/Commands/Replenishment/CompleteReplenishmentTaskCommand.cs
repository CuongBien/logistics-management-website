using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Errors;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Commands.Replenishment;

public record CompleteReplenishmentTaskCommand(
    Guid TaskId,
    string OperatorId) : IRequest<Result<bool>>;

public sealed class CompleteReplenishmentTaskCommandHandler : IRequestHandler<CompleteReplenishmentTaskCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CompleteReplenishmentTaskCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;
    private readonly IInventoryService _inventoryService;

    public CompleteReplenishmentTaskCommandHandler(
        IApplicationDbContext context, 
        ILogger<CompleteReplenishmentTaskCommandHandler> logger, 
        IOperatorAuthorizationService authService,
        IInventoryService inventoryService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
        _inventoryService = inventoryService;
    }

    public async Task<Result<bool>> Handle(CompleteReplenishmentTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.ReplenishmentTasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task == null)
            return Result<bool>.Failure(Error.NotFound("ReplenishmentTask.NotFound", "Replenishment task not found"));

        if (!await _authService.HasPermissionAsync(request.OperatorId, task.WarehouseId, null, "inventory:replenish", cancellationToken))
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inventory:replenish'."));

        if (task.Status != ReplenishmentTaskStatus.Pending && task.Status != ReplenishmentTaskStatus.InProgress)
            return Result<bool>.Failure(new Error("ReplenishmentTask.InvalidStatus", "Task must be Pending or InProgress to complete"));

        // Move stock
        await _inventoryService.MoveAsync(
            task.TenantId,
            task.WarehouseId,
            task.SourceBinId,
            task.DestinationBinId,
            task.Sku,
            task.RequestedQty,
            task.Id.ToString(),
            request.OperatorId,
            cancellationToken);

        task.Complete();
        task.Assign(request.OperatorId);
        
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ReplenishmentTask {TaskId} completed by {Operator}", task.Id, request.OperatorId);

        return Result<bool>.Success(true);
    }
}
