using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Commands.CreatePickTasks;

public record CreatePickTasksCommand(Guid OutboundOrderId, string? WaveId = null) : IRequest<bool>;

public class CreatePickTasksCommandHandler : IRequestHandler<CreatePickTasksCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public CreatePickTasksCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(CreatePickTasksCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null) throw new Exception("Order not found");

        if (order.Status != OutboundOrderStatus.Allocated)
            return true; // Idempotent

        foreach (var line in order.Lines)
        {
            if (line.ReservedQty <= 0) continue;
            
            // Generate a PickTask for this line
            // In a real scenario, we would map this to the exact Bin where the stock was reserved
            var fakeBinId = Guid.NewGuid(); // Placeholder
            
            var pickTask = new PickTask(line.Id, fakeBinId, line.ReservedQty, request.WaveId);
            _context.PickTasks.Add(pickTask);
        }

        order.ChangeStatus(OutboundOrderStatus.Picking);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
