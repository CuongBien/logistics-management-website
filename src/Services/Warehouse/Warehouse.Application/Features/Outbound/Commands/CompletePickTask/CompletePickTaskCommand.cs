using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Commands.CompletePickTask;

public record CompletePickTaskCommand(Guid PickTaskId) : IRequest<bool>;

public class CompletePickTaskCommandHandler : IRequestHandler<CompletePickTaskCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public CompletePickTaskCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(CompletePickTaskCommand request, CancellationToken cancellationToken)
    {
        var pickTask = await _context.PickTasks
            .FirstOrDefaultAsync(p => p.Id == request.PickTaskId, cancellationToken);

        if (pickTask == null) throw new Exception("Task not found");

        if (pickTask.Status == PickTaskStatus.Completed)
            return true; // Idempotent

        var line = await _context.OutboundOrderLines
            .FirstOrDefaultAsync(l => l.Id == pickTask.OutboundLineId, cancellationToken);

        if (line == null) throw new Exception("Line not found");

        // Execute domain logic
        pickTask.CompleteTask();
        line.AddPickedQty(pickTask.Qty);
        
        // Check if all lines in the order are picked
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == line.OutboundOrderId, cancellationToken);
            
        bool allPicked = order!.Lines.All(l => l.PickedQty == l.ReservedQty);
        if (allPicked)
        {
            order.ChangeStatus(OutboundOrderStatus.Picked);
        }
        else
        {
            order.ChangeStatus(OutboundOrderStatus.PartiallyPicked);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
