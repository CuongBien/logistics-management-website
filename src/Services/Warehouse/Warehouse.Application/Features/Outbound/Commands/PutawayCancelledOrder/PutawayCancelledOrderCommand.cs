using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.PutawayCancelledOrder;

public record PutawayCancelledOrderCommand(Guid OrderId, string TargetBinCode, string OperatorId) : IRequest<Result<bool>>;

public sealed class PutawayCancelledOrderCommandHandler : IRequestHandler<PutawayCancelledOrderCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<PutawayCancelledOrderCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public PutawayCancelledOrderCommandHandler(
        IApplicationDbContext context, 
        ILogger<PutawayCancelledOrderCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(PutawayCancelledOrderCommand request, CancellationToken cancellationToken)
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
            "outbound:putaway",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:putaway' for warehouse '{order.WarehouseId}'."));
        }

        if (order.Status != OutboundOrderStatus.Cancelled)
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Order is {order.Status}. Only Cancelled orders can be putaway."));

        var targetBin = await _context.Bins
            .FirstOrDefaultAsync(b => b.BinCode == request.TargetBinCode && b.WarehouseId == order.WarehouseId, cancellationToken);

        if (targetBin == null)
            return Result<bool>.Failure(Error.NotFound("Bin.NotFound", $"Target bin {request.TargetBinCode} not found in warehouse."));

        var reservations = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .Where(r => r.ReferenceId == order.Id.ToString() && r.ReferenceType == ReservationType.OutboundOrder && r.Status == ReservationStatus.Active)
            .ToListAsync(cancellationToken);

        if (!reservations.Any())
            return Result<bool>.Failure(new Error("Putaway.NoReservations", "No active reservations found to putaway for this order."));

        foreach (var res in reservations)
        {
            if (res.MarkAsConsumed())
            {
                // 1. Consume from original bin
                res.InventoryItem.ConsumeStock(res.Quantity);
                
                var consumeLedger = InventoryLedger.Create(
                    res.InventoryItem,
                    InventoryLedgerReason.OrderCancelled,
                    -res.Quantity,
                    order.Id.ToString(),
                    "OutboundOrder",
                    request.OperatorId,
                    "Consumed from original bin for Cancelled Order Putaway");
                _context.InventoryLedgers.Add(consumeLedger);

                // 2. Restock into target bin
                var targetInventory = await _context.InventoryItems
                    .FirstOrDefaultAsync(i => i.WarehouseId == order.WarehouseId 
                                           && i.TenantId == res.InventoryItem.TenantId 
                                           && i.Sku == res.InventoryItem.Sku 
                                           && i.BinId == targetBin.Id, cancellationToken);

                if (targetInventory == null)
                {
                    targetInventory = InventoryItem.Create(
                        res.InventoryItem.Sku, 
                        res.Quantity, 
                        res.InventoryItem.TenantId, 
                        res.InventoryItem.CustomerId, 
                        order.WarehouseId, 
                        targetBin.Id);
                    _context.InventoryItems.Add(targetInventory);
                }
                else
                {
                    targetInventory.Restock(res.Quantity);
                }

                var restockLedger = InventoryLedger.Create(
                    targetInventory,
                    InventoryLedgerReason.OrderCancelled,
                    res.Quantity,
                    order.Id.ToString(),
                    "OutboundOrder",
                    request.OperatorId,
                    $"Putaway to {request.TargetBinCode} for Cancelled Order");
                _context.InventoryLedgers.Add(restockLedger);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Cancelled Order {OrderId} successfully putaway to bin {BinCode}", order.Id, request.TargetBinCode);

        return Result<bool>.Success(true);
    }
}
