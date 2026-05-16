using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Outbound.Commands.PickStock;

public sealed class PickStockCommandHandler : IRequestHandler<PickStockCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PickStockCommandHandler> _logger;

    public PickStockCommandHandler(IApplicationDbContext context, ILogger<PickStockCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(PickStockCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Generating pick tasks for OutboundOrder {OrderId}", request.OutboundOrderId);

        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null)
            return Result<bool>.Failure(Error.NotFound("OutboundOrder.NotFound", "Order not found"));

        if (order.Status != OutboundOrderStatus.Allocated && 
            order.Status != OutboundOrderStatus.PartiallyAllocated && 
            order.Status != OutboundOrderStatus.Picking)
        {
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot start picking for order in status {order.Status}"));
        }

        if (order.Status == OutboundOrderStatus.PartiallyAllocated && !order.AllowPartial)
        {
            return Result<bool>.Failure(new Error("OutboundOrder.PartialNotAllowed", "Order is partially allocated but partial picking is not allowed."));
        }

        var reservations = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .Where(r => r.ReferenceId == order.Id.ToString() && r.ReferenceType == ReservationType.OutboundOrder && r.Status == ReservationStatus.Active)
            .ToListAsync(cancellationToken);

        var existingPickTasks = await _context.PickTasks
            .Where(pt => pt.OutboundOrderLine.OutboundOrderId == order.Id)
            .ToListAsync(cancellationToken);

        int tasksCreated = 0;

        foreach (var line in order.Lines)
        {
            var lineReservations = reservations.Where(r => r.InventoryItem.Sku == line.Sku).ToList();
            
            foreach (var res in lineReservations)
            {
                // Check how much of this reservation is already assigned to a PickTask
                var existingTaskQty = existingPickTasks
                    .Where(pt => pt.OutboundOrderLineId == line.Id && pt.FromBinId == res.InventoryItem.BinId)
                    .Sum(pt => pt.Quantity);

                int missingQty = res.Quantity - existingTaskQty;

                if (missingQty > 0)
                {
                    var pickTask = PickTask.Create(line.Id, res.InventoryItem.BinId, missingQty, request.WaveId);
                    _context.PickTasks.Add(pickTask);
                    existingPickTasks.Add(pickTask); // Add to local list to prevent duplicates in same run
                    tasksCreated++;
                }
            }
        }

        if (tasksCreated > 0 || existingPickTasks.Any())
        {
            order.UpdateStatus(OutboundOrderStatus.Picking);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Generated {TaskCount} new pick tasks for Order {OrderId}", tasksCreated, order.Id);
            return Result<bool>.Success(true);
        }

        return Result<bool>.Failure(new Error("PickStock.NoReservations", "No active reservations found to generate pick tasks."));
    }
}
