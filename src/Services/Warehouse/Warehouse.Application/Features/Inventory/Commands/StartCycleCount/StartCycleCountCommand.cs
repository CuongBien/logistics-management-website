using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Commands.StartCycleCount;

public record StartCycleCountCommand(Guid TaskId, string OperatorId) : IRequest<Result<bool>>;

public class StartCycleCountCommandHandler : IRequestHandler<StartCycleCountCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public StartCycleCountCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(StartCycleCountCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.CountTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, cancellationToken);
        if (task == null)
            return Result<bool>.Failure(new Error("CountTask.NotFound", "Task not found."));

        if (string.IsNullOrEmpty(task.AssignedTo) || task.AssignedTo != request.OperatorId)
            return Result<bool>.Failure(new Error("CountTask.NotAssignedToYou", "Task is not assigned to you."));

        if (task.Status == Warehouse.Domain.Entities.CountTaskStatus.Counted || task.Status == Warehouse.Domain.Entities.CountTaskStatus.Adjusted)
            return Result<bool>.Failure(new Error("CountTask.InvalidStatus", "Task is already completed."));

        if (task.Status == Warehouse.Domain.Entities.CountTaskStatus.Pending)
        {
            task.Start();
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result<bool>.Success(true);
    }
}
