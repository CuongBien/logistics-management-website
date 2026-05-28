using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inbound.Commands.Putaway;

public record CompletePutawayTaskCommand(
    Guid TaskId,
    string ScannedDestinationBinCode,
    string OperatorId
) : IRequest<Result<bool>>;

public class CompletePutawayTaskCommandHandler : IRequestHandler<CompletePutawayTaskCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CompletePutawayTaskCommandHandler> _logger;
    private readonly IInventoryService _inventoryService;
    private readonly IOperatorAuthorizationService _authService;

    public CompletePutawayTaskCommandHandler(
        IApplicationDbContext context, 
        ILogger<CompletePutawayTaskCommandHandler> logger,
        IInventoryService inventoryService,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _inventoryService = inventoryService;
        _authService = authService;
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

        // 3. Authorization Check
        bool hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId, 
            task.WarehouseId, 
            destBin.ZoneId, 
            "inbound:putaway", 
            cancellationToken);

        if (!hasPermission)
            return Result<bool>.Failure(new Error("Forbidden", $"Operator does not have 'inbound:putaway' permission for destination zone."));

        // 4. Check if it's an override (Soft Enforcement)
        if (task.SuggestedBinId != destBin.Id)
        {
            _logger.LogInformation("Putaway Override: Operator {Operator} placed task {TaskId} into {ActualBin} instead of suggested {SuggestedBin}", 
                request.OperatorId, task.Id, destBin.BinCode, task.SuggestedBin.BinCode);
        }

        // 5. Move Inventory
        try
        {
            await _inventoryService.MoveAsync(
                task.TenantId,
                task.WarehouseId,
                task.SourceBinId,
                destBin.Id,
                task.Sku,
                task.Quantity,
                task.Id.ToString(),
                request.OperatorId,
                cancellationToken);
        }
        catch (Exception ex)
        {
            return Result<bool>.Failure(new Error("Move.Error", ex.Message));
        }

        // 6. Complete the task
        task.Complete(destBin.Id, request.OperatorId);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
