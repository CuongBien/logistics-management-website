using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inbound.Commands.CrossDock;

public record CompleteCrossDockTaskCommand(
    Guid TaskId,
    string OperatorId,
    string ScannedDestinationBinCode
) : IRequest<Result>;

public class CompleteCrossDockTaskCommandHandler : IRequestHandler<CompleteCrossDockTaskCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;
    private readonly IOperatorAuthorizationService _authService;

    public CompleteCrossDockTaskCommandHandler(
        IApplicationDbContext context,
        IInventoryService inventoryService,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _inventoryService = inventoryService;
        _authService = authService;
    }

    public async Task<Result> Handle(CompleteCrossDockTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.CrossDockTasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task == null)
            return Result.Failure(new Error("CrossDockTask.NotFound", $"Task {request.TaskId} not found"));

        if (task.Status == CrossDockTaskStatus.Completed)
            return Result.Failure(new Error("CrossDockTask.AlreadyCompleted", "This cross dock task is already completed."));

        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            task.WarehouseId,
            null,
            "crossdock:execute",
            cancellationToken);

        if (!hasPermission)
        {
            return Result.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'crossdock:execute'."));
        }

        var destBin = await _context.Bins
            .FirstOrDefaultAsync(b => b.Id == task.DestinationBinId, cancellationToken);

        if (destBin == null || destBin.BinCode != request.ScannedDestinationBinCode)
        {
            return Result.Failure(new Error("CrossDockTask.InvalidDestination", "The scanned bin does not match the required destination bin for this task."));
        }

        // Move inventory
        var sourceInventory = await _context.InventoryItems
            .FirstOrDefaultAsync(i => i.WarehouseId == task.WarehouseId && i.BinId == task.SourceBinId && i.Sku == task.Sku, cancellationToken);

        if (sourceInventory == null || sourceInventory.AvailableQty < task.ExpectedQty)
        {
            return Result.Failure(new Error("CrossDockTask.InsufficientStock", "Insufficient stock in the source bin."));
        }

        sourceInventory.Deduct(task.ExpectedQty);

        var destInventory = await _context.InventoryItems
            .FirstOrDefaultAsync(i => i.WarehouseId == task.WarehouseId && i.BinId == task.DestinationBinId && i.Sku == task.Sku, cancellationToken);

        if (destInventory == null)
        {
            destInventory = Domain.Entities.InventoryItem.Create(
                task.Sku,
                task.ExpectedQty,
                task.TenantId,
                sourceInventory.CustomerId, // keep same customer
                task.WarehouseId,
                task.DestinationBinId
            );
            _context.InventoryItems.Add(destInventory);
        }
        else
        {
            destInventory.Restock(task.ExpectedQty);
        }

        // Save inventory changes BEFORE calling ReserveAsync, so the new destination
        // InventoryItem is visible to the reservation query.
        await _context.SaveChangesAsync(cancellationToken);

        // Allocate to OutboundOrder
        var correlationId = $"CROSSDOCK-{task.Id}";
        await _inventoryService.ReserveAsync(
            task.TenantId,
            task.WarehouseId,
            task.Sku,
            task.ExpectedQty,
            task.OutboundOrderId.ToString(),
            ReservationType.OutboundOrder,
            request.OperatorId,
            correlationId,
            cancellationToken
        );

        // Update Outbound Order Line ReservedQty
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == task.OutboundOrderId, cancellationToken);

        if (order != null)
        {
            var line = order.Lines.FirstOrDefault(l => l.Sku == task.Sku);
            if (line != null)
            {
                line.UpdateReserved(line.ReservedQty + task.ExpectedQty);
            }
            
            bool allLinesAllocated = order.Lines.All(l => l.RequestedQty <= l.ReservedQty);
            if (allLinesAllocated)
            {
                order.UpdateStatus(OutboundOrderStatus.Allocated);
            }
            else
            {
                order.UpdateStatus(OutboundOrderStatus.PartiallyAllocated);
            }
        }

        task.Complete(task.ExpectedQty);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
