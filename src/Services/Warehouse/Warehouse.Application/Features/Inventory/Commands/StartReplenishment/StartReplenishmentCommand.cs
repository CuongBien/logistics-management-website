using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Commands.StartReplenishment;

public record StartReplenishmentCommand(Guid TaskId, string OperatorId) : IRequest<Result<bool>>;

public class StartReplenishmentCommandHandler : IRequestHandler<StartReplenishmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public StartReplenishmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(StartReplenishmentCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.ReplenishmentTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, cancellationToken);
        if (task == null)
            return Result<bool>.Failure(new Error("ReplenishmentTask.NotFound", "Task not found."));

        if (string.IsNullOrEmpty(task.AssignedTo) || task.AssignedTo != request.OperatorId)
            return Result<bool>.Failure(new Error("ReplenishmentTask.NotAssignedToYou", "Task is not assigned to you."));

        if (task.Status == Warehouse.Domain.Entities.ReplenishmentTaskStatus.Completed)
            return Result<bool>.Failure(new Error("ReplenishmentTask.InvalidStatus", "Task is already completed."));

        if (task.Status == Warehouse.Domain.Entities.ReplenishmentTaskStatus.Pending)
        {
            task.Start();
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result<bool>.Success(true);
    }
}
