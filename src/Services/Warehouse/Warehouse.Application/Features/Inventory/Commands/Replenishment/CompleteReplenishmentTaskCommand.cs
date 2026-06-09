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
    string OperatorId,
    int? ActualQty = null,
    Guid? ActualDestinationBinId = null) : IRequest<Result<bool>>;

public sealed class CompleteReplenishmentTaskCommandHandler : IRequestHandler<CompleteReplenishmentTaskCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CompleteReplenishmentTaskCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;
    private readonly IInventoryService _inventoryService;
    private readonly INotificationService _notificationService;

    public CompleteReplenishmentTaskCommandHandler(
        IApplicationDbContext context, 
        ILogger<CompleteReplenishmentTaskCommandHandler> logger, 
        IOperatorAuthorizationService authService,
        IInventoryService inventoryService,
        INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
        _inventoryService = inventoryService;
        _notificationService = notificationService;
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

        // Evaluate actual quantity
        int actualQty = request.ActualQty ?? task.RequestedQty;
        
        // Resolve actual destination bin
        Guid destBinId = request.ActualDestinationBinId ?? task.DestinationBinId;
        var destBin = await _context.Bins.FirstOrDefaultAsync(b => b.Id == destBinId, cancellationToken);
        if (destBin == null)
            return Result<bool>.Failure(Error.NotFound("ReplenishmentTask.DestinationBinNotFound", "Destination bin not found"));

        // Move stock
        await _inventoryService.MoveAsync(
            task.TenantId,
            task.WarehouseId,
            task.SourceBinId,
            destBinId,
            task.Sku,
            actualQty,
            task.Id.ToString(),
            request.OperatorId,
            cancellationToken);

        if (actualQty < task.RequestedQty)
        {
            await _notificationService.NotifyAsync(
                "Thiếu Hàng Khi Bổ Sung (Short Replenish)",
                $"Task Bổ sung {task.Id} chỉ lấy được {actualQty}/{task.RequestedQty} sản phẩm {task.Sku} từ kệ {task.SourceBinId}.",
                NotificationType.Warning,
                NotificationCategory.ShortReplenish,
                task.WarehouseId,
                cancellationToken: cancellationToken);
            _logger.LogWarning("Short Replenish for Task {TaskId}. Expected {Expected}, Actual {Actual}", task.Id, task.RequestedQty, actualQty);
        }

        task.Complete(destBinId);
        task.Assign(request.OperatorId);

        var activityLog = new OperatorActivityLog(
            task.TenantId,
            task.WarehouseId,
            request.OperatorId,
            "Replenish",
            task.Id,
            task.Sku,
            actualQty,
            task.StartedAt ?? task.CreatedAt,
            task.CompletedAt ?? DateTime.UtcNow
        );
        _context.OperatorActivityLogs.Add(activityLog);

        // Log override if destination bin differs
        if (destBinId != task.DestinationBinId)
        {
            var origBin = await _context.Bins.FirstOrDefaultAsync(b => b.Id == task.DestinationBinId, cancellationToken);
            var origCode = origBin?.BinCode ?? "UNKNOWN";

            var overrideLog = new TaskOverrideLog(
                task.TenantId,
                task.WarehouseId,
                request.OperatorId,
                "Replenish",
                task.Id,
                task.Sku,
                actualQty,
                origCode,
                destBin.BinCode,
                "Operator overrode destination replenishment bin"
            );
            _context.TaskOverrideLogs.Add(overrideLog);
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("ReplenishmentTask {TaskId} completed by {Operator}", task.Id, request.OperatorId);

        return Result<bool>.Success(true);
    }
}
