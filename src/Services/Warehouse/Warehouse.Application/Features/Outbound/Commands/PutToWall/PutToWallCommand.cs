using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.PutToWall;

public record PutToWallResult(string TargetCubbyBinCode, bool IsOrderFullySorted);

public record PutToWallCommand(
    string WaveId,
    string Sku,
    string OperatorId) : IRequest<Result<PutToWallResult>>;

public sealed class PutToWallCommandHandler : IRequestHandler<PutToWallCommand, Result<PutToWallResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PutToWallCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public PutToWallCommandHandler(
        IApplicationDbContext context, 
        ILogger<PutToWallCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<PutToWallResult>> Handle(PutToWallCommand request, CancellationToken cancellationToken)
    {
        // 1. Find a completed PickTask for this Wave & SKU that hasn't been put to wall yet
        var taskToPut = await _context.PickTasks
            .Include(pt => pt.OutboundOrderLine)
                .ThenInclude(l => l.OutboundOrder)
                    .ThenInclude(o => o.Lines)
            .Where(pt => pt.WaveId == request.WaveId 
                      && pt.OutboundOrderLine.Sku == request.Sku 
                      && pt.Status == PickTaskStatus.Completed 
                      && pt.PutToWallAt == null)
            .FirstOrDefaultAsync(cancellationToken);

        if (taskToPut == null)
        {
            return Result<PutToWallResult>.Failure(new Error("PutToWall.NoTaskFound", 
                $"No pending Put-to-Wall task found for SKU {request.Sku} in Wave {request.WaveId}."));
        }

        var order = taskToPut.OutboundOrderLine.OutboundOrder;

        if (!await _authService.HasPermissionAsync(request.OperatorId, order.WarehouseId, null, "outbound:sort", cancellationToken))
            return Result<PutToWallResult>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:sort'."));

        // 2. Determine target cubby for this Order
        // Does this order already have a wall bin assigned?
        var existingAssignedBin = await _context.Bins
            .Where(b => b.WarehouseId == order.WarehouseId 
                     && b.CurrentOrderId == order.Id 
                     && b.BinCode.Contains("WALL"))
            .FirstOrDefaultAsync(cancellationToken);

        Bin? targetBin;

        if (existingAssignedBin != null)
        {
            targetBin = existingAssignedBin;
        }
        else
        {
            // Find an Available Wall Bin
            targetBin = await _context.Bins
                .Where(b => b.WarehouseId == order.WarehouseId 
                         && b.BinCode.Contains("WALL") 
                         && b.Status == "Available")
                .OrderBy(b => b.BinCode)
                .FirstOrDefaultAsync(cancellationToken);

            if (targetBin == null)
                return Result<PutToWallResult>.Failure(new Error("PutToWall.NoAvailableWallBin", "No available Put-to-Wall cubby found."));

            targetBin.AssignOrder(order.Id);
        }

        // 3. Mark PickTask as Put
        taskToPut.PutToWall(targetBin.BinCode);
        await _context.SaveChangesAsync(cancellationToken); // Save to calculate IsFullySorted correctly

        // 4. Check if the order is fully sorted (All completed PickTasks for this order are put to wall)
        // Note: For partial fulfillment, some lines might not have pick tasks, but we only check pick tasks.
        var allTasksForOrder = await _context.PickTasks
            .Where(pt => pt.OutboundOrderLine.OutboundOrderId == order.Id)
            .ToListAsync(cancellationToken);
            
        bool isFullySorted = allTasksForOrder.All(pt => pt.PutToWallAt != null && pt.Status == PickTaskStatus.Completed);

        if (isFullySorted)
        {
            // Move order status to ReadyToPack or Packing?
            // Order has statuses: Picked, Packing, Packed.
            // When fully sorted, it is effectively Picked and ready to be Packed. 
            // We can leave it as Picked (or PartiallyPicked) and let the Packer start Packing.
            // The Packer will then free up the bin.
            _logger.LogInformation("Order {OrderId} is fully sorted to cubby {Cubby}", order.Id, targetBin.BinCode);
        }

        return Result<PutToWallResult>.Success(new PutToWallResult(targetBin.BinCode, isFullySorted));
    }
}
