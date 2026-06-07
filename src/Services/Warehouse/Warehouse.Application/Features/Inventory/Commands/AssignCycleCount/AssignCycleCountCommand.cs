using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Commands.AssignCycleCount;

public record AssignCycleCountCommand(Guid TaskId, string OperatorId) : IRequest<Result<bool>>;

public class AssignCycleCountCommandHandler : IRequestHandler<AssignCycleCountCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AssignCycleCountCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(AssignCycleCountCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.CountTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, cancellationToken);
        if (task == null)
            return Result<bool>.Failure(new Error("CountTask.NotFound", "Task not found."));

        if (!string.IsNullOrEmpty(task.AssignedTo) && task.AssignedTo != request.OperatorId)
            return Result<bool>.Failure(new Error("CountTask.AlreadyAssigned", "Task is already assigned."));

        task.Assign(request.OperatorId);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
