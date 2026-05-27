using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inventory.Commands.CycleCount;

public record ApproveCountAdjustmentCommand(
    Guid TaskId,
    string ManagerId) : IRequest<Result<bool>>;

public sealed class ApproveCountAdjustmentCommandHandler : IRequestHandler<ApproveCountAdjustmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ApproveCountAdjustmentCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;
    private readonly IInventoryService _inventoryService;

    public ApproveCountAdjustmentCommandHandler(
        IApplicationDbContext context, 
        ILogger<ApproveCountAdjustmentCommandHandler> logger, 
        IOperatorAuthorizationService authService,
        IInventoryService inventoryService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
        _inventoryService = inventoryService;
    }

    public async Task<Result<bool>> Handle(ApproveCountAdjustmentCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.CountTasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task == null)
            return Result<bool>.Failure(Error.NotFound("CountTask.NotFound", "Count task not found"));

        if (task.Status != CountTaskStatus.Counted)
            return Result<bool>.Failure(new Error("CountTask.InvalidStatus", "Only Counted tasks can be adjusted"));

        if (!await _authService.HasPermissionAsync(request.ManagerId, task.WarehouseId, null, "inventory:count", cancellationToken))
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.ManagerId}' does not have permission 'inventory:count'."));

        if (task.CountedQty.HasValue && task.CountedQty.Value != task.ExpectedQty)
        {
            int diff = task.CountedQty.Value - task.ExpectedQty;
            
            await _inventoryService.AdjustAsync(
                task.TenantId,
                task.WarehouseId,
                task.BinId,
                task.Sku,
                diff,
                task.Id.ToString(),
                request.ManagerId,
                cancellationToken);
        }

        task.MarkAdjusted();
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("CountTask {TaskId} adjustment approved by {Manager}", task.Id, request.ManagerId);

        return Result<bool>.Success(true);
    }
}
