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
    string OperatorId,
    int? PickedQuantity = null) : IRequest<Result<bool>>;

public sealed class ConfirmPickCommandHandler : IRequestHandler<ConfirmPickCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ConfirmPickCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;
    private readonly INotificationService _notificationService;

    public ConfirmPickCommandHandler(
        IApplicationDbContext context, 
        ILogger<ConfirmPickCommandHandler> logger, 
        IOperatorAuthorizationService authService,
        INotificationService notificationService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
        _notificationService = notificationService;
    }

    public async Task<Result<bool>> Handle(ConfirmPickCommand request, CancellationToken cancellationToken)
    {
        var pickTask = await _context.PickTasks
            .Include(pt => pt.OutboundOrderLine)
            .ThenInclude(l => l.OutboundOrder)
            .FirstOrDefaultAsync(pt => pt.Id == request.PickTaskId, cancellationToken);

        if (pickTask == null)
            return Result<bool>.Failure(Error.NotFound("PickTask.NotFound", "Pick task not found"));

        // Check permission
        var order = pickTask.OutboundOrderLine.OutboundOrder;
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            order.WarehouseId,
            null,
            "outbound:pick",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:pick' for warehouse '{order.WarehouseId}'."));
        }

        if (pickTask.Status == PickTaskStatus.Completed)
            return Result<bool>.Success(true); // Idempotent

        // Complete the task
        pickTask.Complete(request.OperatorId);

        // Update Line
        var line = pickTask.OutboundOrderLine;
        var actualPickedQty = request.PickedQuantity ?? pickTask.Quantity;
        line.UpdatePicked(line.PickedQty + actualPickedQty);

        if (actualPickedQty < pickTask.Quantity)
        {
            await _notificationService.NotifyAsync(
                "Thiếu Hàng Khi Pick (Short Pick)",
                $"Task Pick {pickTask.Id} chỉ lấy được {actualPickedQty}/{pickTask.Quantity} sản phẩm {line.Sku}.",
                Domain.Entities.NotificationType.Error,
                Domain.Entities.NotificationCategory.ShortPick,
                order.WarehouseId,
                cancellationToken: cancellationToken);
        }

        // Check if all lines are fully picked
        
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
