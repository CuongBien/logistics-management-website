using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inbound.Commands.Putaway;

public record CompletePutawayTaskCommand(
    Guid TaskId,
    string ScannedDestinationBinCode,
    string OperatorId,
    int? QuantityToPut = null
) : IRequest<Result<bool>>;

public class CompletePutawayTaskCommandHandler : IRequestHandler<CompletePutawayTaskCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CompletePutawayTaskCommandHandler> _logger;
    private readonly IInventoryService _inventoryService;
    private readonly IOperatorAuthorizationService _authService;
    private readonly INotificationService _notificationService;

    public CompletePutawayTaskCommandHandler(
        IApplicationDbContext context, 
        ILogger<CompletePutawayTaskCommandHandler> logger,
        IInventoryService inventoryService,
        IOperatorAuthorizationService authService,
        INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _inventoryService = inventoryService;
        _authService = authService;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(CompletePutawayTaskCommand request, CancellationToken cancellationToken)
    {
        // 1. Fetch the Putaway Task
        var task = await _context.PutawayTasks
            .Include(t => t.SourceBin)
            .Include(t => t.SuggestedBin)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task == null)
            return Result<bool>.Failure(new Error("PutawayTask.NotFound", $"Task {request.TaskId} not found."));

        if (task.Status != PutawayTaskStatus.Pending)
            return Result<bool>.Failure(new Error("PutawayTask.InvalidStatus", $"Task is already {task.Status}."));

        // 2. Fetch the Scanned Destination Bin
        var destBin = await _context.Bins
            .Include(b => b.Zone)
            .FirstOrDefaultAsync(b => b.WarehouseId == task.WarehouseId && b.BinCode == request.ScannedDestinationBinCode, cancellationToken);

        if (destBin == null)
            return Result<bool>.Failure(new Error("PutawayTask.InvalidBin", $"Destination bin {request.ScannedDestinationBinCode} not found in this warehouse."));

        // Validate Bin Status
        if (destBin.Status == BinStatus.Maintenance.ToString() || 
            destBin.Status == BinStatus.Locked.ToString() || 
            destBin.Status == BinStatus.Disabled.ToString() ||
            destBin.Status == BinStatus.Full.ToString())
        {
            return Result<bool>.Failure(new Error("PutawayTask.InvalidBinStatus", $"Destination bin {request.ScannedDestinationBinCode} is in {destBin.Status} status."));
        }

        // Determine Quantity to Put
        var quantityToPut = request.QuantityToPut ?? task.Quantity;
        if (quantityToPut <= 0)
        {
            return Result<bool>.Failure(new Error("PutawayTask.InvalidQuantity", "Quantity to put must be greater than zero."));
        }
        if (quantityToPut > task.Quantity)
        {
            return Result<bool>.Failure(new Error("PutawayTask.QuantityExceeded", $"Quantity to put ({quantityToPut}) cannot exceed task quantity ({task.Quantity})."));
        }

        // Capacity Check
        var currentInventory = await _context.InventoryItems
            .Where(i => i.WarehouseId == task.WarehouseId && i.BinId == destBin.Id)
            .ToListAsync(cancellationToken);
        
        var currentQty = currentInventory.Sum(i => i.QuantityOnHand);
        var currentWeight = currentQty * 0.5;
        var currentVolume = currentQty * 0.001;

        var additionalWeight = quantityToPut * 0.5;
        var additionalVolume = quantityToPut * 0.001;

        if (destBin.MaxQuantity.HasValue && currentQty + quantityToPut > destBin.MaxQuantity.Value)
        {
            return Result<bool>.Failure(new Error("PutawayTask.BinOverCapacity", $"Destination bin would exceed max quantity limit of {destBin.MaxQuantity.Value}. Current: {currentQty}, Adding: {quantityToPut}"));
        }
        
        if (destBin.MaxWeight.HasValue && currentWeight + additionalWeight > destBin.MaxWeight.Value)
        {
            return Result<bool>.Failure(new Error("PutawayTask.BinOverWeight", $"Destination bin would exceed max weight limit of {destBin.MaxWeight.Value} kg. Current: {currentWeight} kg, Adding: {additionalWeight} kg"));
        }

        if (destBin.MaxVolume.HasValue && currentVolume + additionalVolume > destBin.MaxVolume.Value)
        {
            return Result<bool>.Failure(new Error("PutawayTask.BinOverVolume", $"Destination bin would exceed max volume limit of {destBin.MaxVolume.Value} m3. Current: {currentVolume} m3, Adding: {additionalVolume} m3"));
        }

        // 3. Authorization Check
        bool hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId, 
            task.WarehouseId, 
            destBin.ZoneId, 
            "inbound:putaway", 
            cancellationToken);

        if (!hasPermission)
            return Result<bool>.Failure(new Error("Forbidden", $"Operator does not have 'inbound:putaway' permission for destination zone."));

        // 4. Move Inventory
        try
        {
            await _inventoryService.MoveAsync(
                task.TenantId,
                task.WarehouseId,
                task.SourceBinId,
                destBin.Id,
                task.Sku,
                quantityToPut,
                task.Id.ToString(),
                request.OperatorId,
                cancellationToken);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(new Error("Move.Error", ex.Message));
        }

        // 5. Task Split / Quantity Update
        bool isPartial = quantityToPut < task.Quantity;
        if (isPartial)
        {
            var remainingQty = task.Quantity - quantityToPut;
            
            // Create a new split task for the remaining quantity
            var splitTask = new PutawayTask(
                task.TenantId,
                task.WarehouseId,
                task.ReceiptId,
                task.Sku,
                task.LotNo,
                remainingQty,
                task.SourceBinId,
                task.SuggestedBinId
            );
            
            _context.PutawayTasks.Add(splitTask);
            task.UpdateQuantity(quantityToPut);
        }

        // 6. Complete the task
        task.Complete(destBin.Id, request.OperatorId);

        // Update Bin Status to Full if capacity reached
        var newQty = currentQty + quantityToPut;
        if (destBin.MaxQuantity.HasValue && newQty >= destBin.MaxQuantity.Value)
        {
            destBin.UpdateStatus(BinStatus.Full);
        }

        // 7. Audit Log - Activity Log
        var activityLog = new OperatorActivityLog(
            task.TenantId,
            task.WarehouseId,
            request.OperatorId,
            "Putaway",
            task.Id,
            task.Sku,
            quantityToPut,
            task.StartedAt ?? task.CreatedAt,
            task.CompletedAt ?? DateTime.UtcNow
        );
        _context.OperatorActivityLogs.Add(activityLog);

        // 8. Log Override if actual bin differs from suggested bin
        if (task.SuggestedBinId != destBin.Id)
        {
            _logger.LogInformation("Putaway Override: Operator {Operator} placed task {TaskId} into {ActualBin} instead of suggested {SuggestedBin}", 
                request.OperatorId, task.Id, destBin.BinCode, task.SuggestedBin.BinCode);

            var overrideLog = new TaskOverrideLog(
                task.TenantId,
                task.WarehouseId,
                request.OperatorId,
                "Putaway",
                task.Id,
                task.Sku,
                quantityToPut,
                task.SuggestedBin.BinCode,
                destBin.BinCode,
                "Operator overrode suggested putaway location"
            );
            _context.TaskOverrideLogs.Add(overrideLog);
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        await _notificationService.NotifyAsync(
            "Hoàn thành cất hàng",
            $"Nhân viên {request.OperatorId} đã cất xong {(isPartial ? $"{quantityToPut} (một phần)" : "toàn bộ")} lô {task.Sku}.",
            Domain.Entities.NotificationType.Success,
            Domain.Entities.NotificationCategory.PutawayCompleted,
            task.WarehouseId,
            cancellationToken: cancellationToken);

        return Result<bool>.Success(true);
    }
}
