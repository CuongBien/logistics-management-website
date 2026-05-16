using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.PickStock;

public record ConfirmPickCommand(
    Guid PickTaskId, 
    string OperatorId) : IRequest<Result<bool>>;

public sealed class ConfirmPickCommandHandler : IRequestHandler<ConfirmPickCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ConfirmPickCommandHandler> _logger;

    public ConfirmPickCommandHandler(IApplicationDbContext context, ILogger<ConfirmPickCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(ConfirmPickCommand request, CancellationToken cancellationToken)
    {
        var pickTask = await _context.PickTasks
            .Include(pt => pt.OutboundOrderLine)
            .ThenInclude(l => l.OutboundOrder)
            .FirstOrDefaultAsync(pt => pt.Id == request.PickTaskId, cancellationToken);

        if (pickTask == null)
            return Result<bool>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found"));

        if (pickTask.Status == PickTaskStatus.Completed)
            return Result<bool>.Success(true); // Idempotent

        // Complete the task
        pickTask.Complete(request.OperatorId);

        // Update Line
        var line = pickTask.OutboundOrderLine;
        line.UpdatePicked(line.PickedQty + pickTask.Quantity);

        // Check if all lines are fully picked
        var order = line.OutboundOrder;
        
        // Update Order Status
        var allFullyPicked = order.Lines.All(l => l.PickedQty >= l.RequestedQty);
        var anyPicked = order.Lines.Any(l => l.PickedQty > 0);

        if (allFullyPicked)
        {
            order.UpdateStatus(OutboundOrderStatus.Picked);
            _logger.LogInformation("Order {OrderId} is fully picked", order.Id);
        }
        else if (anyPicked)
        {
            order.UpdateStatus(OutboundOrderStatus.PartiallyPicked);
            _logger.LogInformation("Order {OrderId} is partially picked", order.Id);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("PickTask {TaskId} completed by {Operator}", pickTask.Id, request.OperatorId);

        return Result<bool>.Success(true);
    }
}
