using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inventory.Commands.CycleCount;

public record SubmitCountResultCommand(
    Guid TaskId,
    int CountedQty,
    string OperatorId) : IRequest<Result<bool>>;

public sealed class SubmitCountResultCommandHandler : IRequestHandler<SubmitCountResultCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<SubmitCountResultCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public SubmitCountResultCommandHandler(IApplicationDbContext context, ILogger<SubmitCountResultCommandHandler> logger, IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(SubmitCountResultCommand request, CancellationToken cancellationToken)
    {
        var task = await _context.CountTasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, cancellationToken);

        if (task == null)
            return Result<bool>.Failure(Error.NotFound("CountTask.NotFound", "Count task not found"));

        if (!await _authService.HasPermissionAsync(request.OperatorId, task.WarehouseId, null, "inventory:count", cancellationToken))
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inventory:count'."));

        if (request.CountedQty < 0)
            return Result<bool>.Failure(new Error("InvalidQuantity", "Counted quantity cannot be negative"));

        task.SubmitCount(request.CountedQty);
        task.Assign(request.OperatorId);
        
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("CountTask {TaskId} submitted with qty {Qty}. Expected: {Expected}", task.Id, request.CountedQty, task.ExpectedQty);

        return Result<bool>.Success(true);
    }
}
