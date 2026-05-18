using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveTransitShipment;

public record ReceiveTransitShipmentCommand(Guid OrderId, Guid WarehouseId, string OperatorId) : IRequest<Result<bool>>;

public class ReceiveTransitShipmentCommandHandler : IRequestHandler<ReceiveTransitShipmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ReceiveTransitShipmentCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public ReceiveTransitShipmentCommandHandler(IApplicationDbContext context, ILogger<ReceiveTransitShipmentCommandHandler> logger, IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(ReceiveTransitShipmentCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Receiving Transit Package for Order {OrderId} at Warehouse {WarehouseId}", request.OrderId, request.WarehouseId);

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            request.WarehouseId,
            null,
            "inbound:transit_receive",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inbound:transit_receive' for warehouse '{request.WarehouseId}'."));
        }

        // 1. Find the Outbound Order
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
        {
            return Result<bool>.Failure(Error.NotFound("OutboundOrder.NotFound", $"Outbound Order {request.OrderId} not found."));
        }

        // 2. Find the active dispatched Shipment containing this order
        var shipmentOrder = await _context.ShipmentOrders
            .Include(so => so.Shipment)
            .FirstOrDefaultAsync(so => so.OutboundOrderId == order.Id && so.Shipment.Status == ShipmentStatus.Shipped, cancellationToken);

        if (shipmentOrder == null)
        {
            return Result<bool>.Failure(Error.NotFound("Shipment.NotFound", $"No shipped Shipment found containing Order {request.OrderId}."));
        }

        var shipment = shipmentOrder.Shipment;

        // 3. Find standard transit bin at receiving warehouse (BIN-A1-01)
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.BinCode == "BIN-A1-01" && b.WarehouseId == request.WarehouseId, cancellationToken);

        if (bin == null)
        {
            return Result<bool>.Failure(Error.NotFound("Bin.NotFound", $"Standard Transit Bin BIN-A1-01 not found at warehouse {request.WarehouseId}."));
        }

        // 4. Find or create temporary Inbound Receipt representing transit reception
        var sourceReceiptNo = $"RCV-TRANSIT-{shipment.ShipmentNo[..8]}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
        var receipt = await _context.InboundReceipts
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.OrderId == order.OrderId && r.WarehouseId == request.WarehouseId, cancellationToken);

        if (receipt == null)
        {
            receipt = new InboundReceipt(
                order.OrderId,
                order.TenantId,
                order.CustomerId,
                request.WarehouseId,
                sourceReceiptNo,
                shipment.ShipmentNo
            );
            _context.InboundReceipts.Add(receipt);
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Unload/Receive each item into intermediate hub inventory
        foreach (var line in order.Lines)
        {
            int qtyToReceive = line.RequestedQty;

            // 4.1 Find or create Inbound Receipt Line
            var receiptLine = receipt.Lines.FirstOrDefault(l => l.Sku == line.Sku);
            if (receiptLine == null)
            {
                receiptLine = new InboundReceiptLine(receipt.Id, order.TenantId, order.CustomerId, line.Sku, qtyToReceive);
                _context.InboundReceiptLines.Add(receiptLine);
                receipt.AddLine(receiptLine);
            }

            receiptLine.AddReceivedQuantity(qtyToReceive);

            // 4.2 Add Inbound Allocation
            var allocation = new InboundBinAllocation(receiptLine.Id, bin.Id, qtyToReceive, order.TenantId);
            _context.InboundBinAllocations.Add(allocation);

            // 4.3 Upsert InventoryItem at receiving intermediate hub
            var inventoryItem = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.WarehouseId == request.WarehouseId 
                                       && i.TenantId == order.TenantId 
                                       && i.Sku == line.Sku 
                                       && i.BinId == bin.Id, cancellationToken);

            if (inventoryItem == null)
            {
                inventoryItem = InventoryItem.Create(line.Sku, qtyToReceive, order.TenantId, order.CustomerId, request.WarehouseId, bin.Id);
                _context.InventoryItems.Add(inventoryItem);
            }
            else
            {
                inventoryItem.Restock(qtyToReceive);
            }

            // 4.4 Create Inventory Ledger Log
            var ledger = InventoryLedger.Create(
                inventoryItem,
                InventoryLedgerReason.InboundReceived,
                qtyToReceive,
                receipt.Id.ToString(),
                "Receipt",
                request.OperatorId);
            
            _context.InventoryLedgers.Add(ledger);

            // 4.5 Reset shipped quantity to allow next-leg shipment
            line.UpdateShipped(0);
        }

        // Mark intermediate inbound receipt as fully received
        receipt.RecalculateStatus();

        // CRITICAL: Update the Outbound Order's physical location & status to enable next-leg dispatch
        order.UpdateWarehouse(request.WarehouseId);
        order.UpdateStatus(OutboundOrderStatus.Packed); // Reset status to Packed

        // 5. Mark incoming shipment as Delivered at its current intermediate stop
        shipment.Deliver();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully received Transit Package for Order {OrderId} at Warehouse {WarehouseId}. Next-leg order is ready for dispatch.", request.OrderId, request.WarehouseId);
        return Result<bool>.Success(true);
    }
}
