using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.SplitOrder;

public record SplitOutboundOrderCommand(
    Guid OrderId,
    string OperatorId) : IRequest<Result<Guid>>;

public sealed class SplitOutboundOrderCommandHandler : IRequestHandler<SplitOutboundOrderCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<SplitOutboundOrderCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public SplitOutboundOrderCommandHandler(
        IApplicationDbContext context, 
        ILogger<SplitOutboundOrderCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<Guid>> Handle(SplitOutboundOrderCommand request, CancellationToken cancellationToken)
    {
        var originalOrder = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (originalOrder == null)
            return Result<Guid>.Failure(Error.NotFound("OutboundOrder.NotFound", "Original order not found"));

        if (!await _authService.HasPermissionAsync(request.OperatorId, originalOrder.WarehouseId, null, "outbound:create", cancellationToken))
            return Result<Guid>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:create' for warehouse '{originalOrder.WarehouseId}'."));

        if (originalOrder.Status != OutboundOrderStatus.PartiallyAllocated)
            return Result<Guid>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot split order in status {originalOrder.Status}. Must be PartiallyAllocated."));

        if (!originalOrder.AllowPartial)
            return Result<Guid>.Failure(new Error("OutboundOrder.PartialNotAllowed", "Order does not allow partial fulfillment."));

        // Identify unfulfilled lines
        var unfulfilledLines = originalOrder.Lines.Where(l => l.ReservedQty < l.RequestedQty).ToList();
        if (!unfulfilledLines.Any())
            return Result<Guid>.Failure(new Error("OutboundOrder.FullyAllocated", "No unfulfilled lines found to split."));

        // Create new order (Backorder)
        var newOrderId = Guid.NewGuid();
        var newOrderNo = $"{originalOrder.OrderNo}-B";

        var newOrder = OutboundOrder.Create(
            originalOrder.TenantId,
            originalOrder.CustomerId,
            originalOrder.WarehouseId,
            newOrderId,
            newOrderNo,
            originalOrder.DestinationAddress,
            originalOrder.DestinationCity,
            originalOrder.Priority,
            originalOrder.AllowPartial,
            originalOrder.PartnerId,
            originalOrder.Latitude,
            originalOrder.Longitude,
            originalOrder.Weight, // Should recalculate ideally, keep simple for now
            originalOrder.Volume,
            request.OperatorId);

        _context.OutboundOrders.Add(newOrder);

        // Adjust lines
        foreach (var originalLine in unfulfilledLines)
        {
            var backorderQty = originalLine.RequestedQty - originalLine.ReservedQty;
            
            // Add backorder line to new order
            newOrder.AddLine(originalLine.Sku, backorderQty, originalLine.Uom);
            
            // Modify original line requested qty to match what was reserved
            originalLine.UpdateRequestedQuantity(originalLine.ReservedQty);
        }

        // The original order is now fully allocated relative to its new requested quantities
        originalOrder.UpdateStatus(OutboundOrderStatus.Allocated);

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Order {OrderId} split successfully. Backorder created: {BackorderId}", originalOrder.Id, newOrder.Id);

        return Result<Guid>.Success(newOrder.Id);
    }
}
