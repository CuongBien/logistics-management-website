using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Commands.AssignReplenishment;

public record AssignReplenishmentCommand(Guid TaskId, string OperatorId) : IRequest<Result<bool>>;

public class AssignReplenishmentCommandHandler : IRequestHandler<AssignReplenishmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AssignReplenishmentCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(AssignReplenishmentCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.ReplenishmentTasks.FirstOrDefaultAsync(x => x.Id == request.TaskId, cancellationToken);
        if (task == null)
            return Result<bool>.Failure(new Error("ReplenishmentTask.NotFound", "Task not found."));

        if (!string.IsNullOrEmpty(task.AssignedTo) && task.AssignedTo != request.OperatorId)
            return Result<bool>.Failure(new Error("ReplenishmentTask.AlreadyAssigned", "Task is already assigned."));

        task.Assign(request.OperatorId);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
