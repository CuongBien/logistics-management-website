using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.CancelOutboundOrder;

public record CancelOutboundOrderCommand(Guid OrderId, string OperatorId) : IRequest<Result<bool>>;

public sealed class CancelOutboundOrderCommandHandler : IRequestHandler<CancelOutboundOrderCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CancelOutboundOrderCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public CancelOutboundOrderCommandHandler(
        IApplicationDbContext context, 
        ILogger<CancelOutboundOrderCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(CancelOutboundOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return Result<bool>.Failure(Error.NotFound("OutboundOrder.NotFound", "Order not found"));

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            order.WarehouseId,
            null,
            "outbound:cancel",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:cancel' for warehouse '{order.WarehouseId}'."));
        }

        if (order.Status == OutboundOrderStatus.Cancelled)
            return Result<bool>.Success(true); // Idempotent

        if (order.Status == OutboundOrderStatus.Shipped || order.Status == OutboundOrderStatus.Delivered)
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot cancel order in status {order.Status}"));

        bool hasPickedItems = order.Lines.Any(l => l.PickedQty > 0);
        bool requiresPutaway = hasPickedItems || order.Status >= OutboundOrderStatus.Picking;

        // Cancel the order first
        order.UpdateStatus(OutboundOrderStatus.Cancelled);

        // Cancel pending pick tasks
        var pickTasks = await _context.PickTasks
            .Where(pt => pt.OutboundOrderLine.OutboundOrderId == request.OrderId && 
                        (pt.Status == PickTaskStatus.Pending || pt.Status == PickTaskStatus.InProgress))
            .ToListAsync(cancellationToken);

        foreach (var pt in pickTasks)
        {
            pt.Cancel();
        }

        // If not picked, auto-release reservations
        if (!requiresPutaway)
        {
            var reservations = await _context.InventoryReservations
                .Include(r => r.InventoryItem)
                .Where(r => r.ReferenceId == order.Id.ToString() && r.ReferenceType == ReservationType.OutboundOrder && r.Status == ReservationStatus.Active)
                .ToListAsync(cancellationToken);

            foreach (var res in reservations)
            {
                if (res.MarkAsReleased())
                {
                    res.InventoryItem.ReleaseStock(res.Quantity);
                    var ledger = InventoryLedger.Create(
                        res.InventoryItem,
                        InventoryLedgerReason.OrderCancelled,
                        res.Quantity,
                        order.Id.ToString(),
                        "OutboundOrder",
                        request.OperatorId,
                        "Order Cancelled - Auto Released");
                    _context.InventoryLedgers.Add(ledger);
                }
            }
            _logger.LogInformation("Order {OrderId} cancelled and inventory auto-released.", order.Id);
        }
        else
        {
            _logger.LogWarning("Order {OrderId} cancelled but requires putaway flow because items were already picked.", order.Id);
            // We do NOT release the reservations here. They remain active until the Putaway flow consumes them.
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (requiresPutaway)
        {
            // Tạm thời trả về Success nhưng kèm theo Warning/Note (Hiện Result<bool> không có trường Warning, ta chỉ log ra)
            return Result<bool>.Success(true);
        }

        return Result<bool>.Success(true);
    }
}
