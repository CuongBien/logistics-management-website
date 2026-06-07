using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inbound.Commands.AssignPutawayTask;

public record AssignPutawayTaskCommand(Guid TaskId, string OperatorId) : IRequest<Result<bool>>;

public class AssignPutawayTaskCommandHandler : IRequestHandler<AssignPutawayTaskCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AssignPutawayTaskCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(AssignPutawayTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.PutawayTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, cancellationToken);
        if (task == null)
        {
            return Result<bool>.Failure(new Error("PutawayTask.NotFound", "Task not found."));
        }

        // Use Complete method to assign if it hasn't started yet, but actually PutawayTask only has OperatorId
        // Wait, PutawayTask doesn't have an explicit Assign method, it only has Complete(binId, operatorId).
        // Let's just set OperatorId directly if it's null.
        if (task.OperatorId != null && task.OperatorId != request.OperatorId)
        {
            return Result<bool>.Failure(new Error("PutawayTask.AlreadyAssigned", "Task is already assigned to someone else."));
        }

        // To set OperatorId we need to expose it or use reflection, or add Assign method to PutawayTask.
        // Let's add Assign method in a future step, or I will just update the property in Entity by adding Assign method.
        // For now, I will write the handler.
        task.Assign(request.OperatorId);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
