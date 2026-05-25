using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.ReceiveReturnShipment;

public record ReceiveReturnShipmentCommand(Guid ShipmentId, string TargetBinCode, string OperatorId) : IRequest<Result<bool>>;

public sealed class ReceiveReturnShipmentCommandHandler : IRequestHandler<ReceiveReturnShipmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ReceiveReturnShipmentCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public ReceiveReturnShipmentCommandHandler(
        IApplicationDbContext context, 
        ILogger<ReceiveReturnShipmentCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(ReceiveReturnShipmentCommand request, CancellationToken cancellationToken)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Orders)
                .ThenInclude(so => so.OutboundOrder)
            .Include(s => s.Items)
                .ThenInclude(si => si.OutboundOrderLine)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
            return Result<bool>.Failure(Error.NotFound("Shipment.NotFound", "Shipment not found"));

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            shipment.WarehouseId,
            null,
            "outbound:return",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:return' for warehouse '{shipment.WarehouseId}'."));
        }

        if (shipment.Status == ShipmentStatus.Returned)
            return Result<bool>.Success(true);

        if (shipment.Status != ShipmentStatus.Shipped && shipment.Status != ShipmentStatus.Failed && shipment.Status != ShipmentStatus.Delivered)
            return Result<bool>.Failure(new Error("Shipment.InvalidStatus", $"Cannot process return for shipment in status {shipment.Status}"));

        var targetBin = await _context.Bins
            .FirstOrDefaultAsync(b => b.BinCode == request.TargetBinCode && b.WarehouseId == shipment.WarehouseId, cancellationToken);

        if (targetBin == null)
            return Result<bool>.Failure(Error.NotFound("Bin.NotFound", $"Target bin {request.TargetBinCode} not found in warehouse."));

        // 1. Mark Shipment as Returned
        shipment.MarkReturned();

        // 2. Mark related Outbound Orders as Failed (Since they failed to reach customer)
        foreach (var order in shipment.Orders.Select(o => o.OutboundOrder))
        {
            if (order.Status != OutboundOrderStatus.Failed && order.Status != OutboundOrderStatus.Cancelled)
            {
                order.UpdateStatus(OutboundOrderStatus.Failed);
            }
        }

        // 3. Putaway items into the TargetBin
        foreach (var item in shipment.Items)
        {
            var sku = item.OutboundOrderLine.Sku;
            var tenantId = shipment.TenantId;
            var customerId = shipment.CustomerId;

            var targetInventory = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.WarehouseId == shipment.WarehouseId 
                                       && i.TenantId == tenantId 
                                       && i.Sku == sku 
                                       && i.BinId == targetBin.Id, cancellationToken);

            if (targetInventory == null)
            {
                targetInventory = InventoryItem.Create(sku, item.Quantity, tenantId, customerId, shipment.WarehouseId, targetBin.Id);
                _context.InventoryItems.Add(targetInventory);
            }
            else
            {
                targetInventory.Restock(item.Quantity);
            }

            var restockLedger = InventoryLedger.Create(
                targetInventory,
                InventoryLedgerReason.ReturnToOrigin,
                item.Quantity,
                shipment.Id.ToString(),
                "Shipment",
                request.OperatorId,
                $"RTO Putaway to {request.TargetBinCode} from Shipment {shipment.ShipmentNo}");
            _context.InventoryLedgers.Add(restockLedger);
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Shipment {ShipmentNo} successfully returned and putaway to {BinCode}", shipment.ShipmentNo, request.TargetBinCode);

        return Result<bool>.Success(true);
    }
}
