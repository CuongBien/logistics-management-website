using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Outbound.Commands.AssignPickTask;

public record AssignPickTaskCommand(Guid TaskId, string OperatorId) : IRequest<Result<bool>>;

public class AssignPickTaskCommandHandler : IRequestHandler<AssignPickTaskCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AssignPickTaskCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(AssignPickTaskCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.PickTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, cancellationToken);
        if (task == null)
        {
            return Result<bool>.Failure(new Error("PickTask.NotFound", "Task not found."));
        }

        if (task.AssignedOperatorId != null && task.AssignedOperatorId != request.OperatorId)
        {
            return Result<bool>.Failure(new Error("PickTask.AlreadyAssigned", "Task is already assigned to someone else."));
        }

        task.Assign(request.OperatorId);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
