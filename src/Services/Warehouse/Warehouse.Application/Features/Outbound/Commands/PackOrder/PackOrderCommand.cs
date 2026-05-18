using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.PackOrder;

public record PackOrderCommand(
    Guid OutboundOrderId, 
    string OperatorId) : IRequest<Result<bool>>;

public sealed class PackOrderCommandHandler : IRequestHandler<PackOrderCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PackOrderCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public PackOrderCommandHandler(IApplicationDbContext context, ILogger<PackOrderCommandHandler> logger, IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(PackOrderCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Packing OutboundOrder {OrderId}", request.OutboundOrderId);

        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null)
            return Result<bool>.Failure(Error.NotFound("OutboundOrder.NotFound", "Order not found"));

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            order.WarehouseId,
            null,
            "outbound:pack",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:pack' for warehouse '{order.WarehouseId}'."));
        }

        if (order.Status == OutboundOrderStatus.Packed)
            return Result<bool>.Success(true);

        if (order.Status != OutboundOrderStatus.Picked)
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot pack order in status {order.Status}"));

        // Update packed qty to match picked qty (assuming full pack)
        foreach (var line in order.Lines)
        {
            line.UpdatePacked(line.PickedQty);
        }

        order.UpdateStatus(OutboundOrderStatus.Packed);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order {OrderId} packed successfully by {Operator}", order.Id, request.OperatorId);
        return Result<bool>.Success(true);
    }
}
