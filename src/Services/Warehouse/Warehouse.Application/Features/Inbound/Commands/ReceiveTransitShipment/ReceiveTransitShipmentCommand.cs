using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveTransitShipment;

public record ReceiveTransitShipmentCommand(
    Guid OrderId, 
    Guid WarehouseId, 
    string OperatorId, 
    Dictionary<string, int>? ReceivedItems = null
) : IRequest<Result<bool>>;

public class ReceiveTransitShipmentCommandHandler : IRequestHandler<ReceiveTransitShipmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ReceiveTransitShipmentCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;

    public ReceiveTransitShipmentCommandHandler(
        IApplicationDbContext context, 
        ILogger<ReceiveTransitShipmentCommandHandler> logger, 
        IOperatorAuthorizationService authService,
        MassTransit.IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
        _publishEndpoint = publishEndpoint;
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
            // BUG-01 FIX: Use ShippedQty (set by previous DispatchShipment) as the
            // reference for what was actually loaded onto the truck, not RequestedQty
            // which represents the original customer order and must never be mutated.
            int shippedQty = line.ShippedQty > 0 ? line.ShippedQty : line.RequestedQty;
            int qtyToReceive = shippedQty;

            if (request.ReceivedItems != null && request.ReceivedItems.TryGetValue(line.Sku, out var customQty))
            {
                qtyToReceive = customQty;
            }

            if (qtyToReceive < 0)
            {
                return Result<bool>.Failure(new Error("TransitReceive.InvalidQuantity", $"Received quantity for SKU {line.Sku} ({qtyToReceive}) cannot be negative."));
            }

            // 4.1 Find or create Inbound Receipt Line
            var receiptLine = receipt.Lines.FirstOrDefault(l => l.Sku == line.Sku);
            if (receiptLine == null)
            {
                receiptLine = new InboundReceiptLine(receipt.Id, order.TenantId, order.CustomerId, line.Sku, shippedQty);
                receiptLine.AddReceivedQuantity(qtyToReceive);
                _context.InboundReceiptLines.Add(receiptLine);
                receipt.AddLine(receiptLine);
            }
            else
            {
                receiptLine.AddReceivedQuantity(qtyToReceive);
            }

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

            // BUG-03 FIX: Reserve the restocked inventory for next-leg dispatch.
            // Without this, DispatchShipment finds zero reservations at the hub
            // and silently skips inventory deduction → ghost inventory accumulates.
            inventoryItem.ReserveStock(qtyToReceive);
            var transitReservation = InventoryReservation.Create(
                inventoryItem.Id,
                order.Id.ToString(),
                ReservationType.OutboundOrder,
                qtyToReceive,
                TimeSpan.FromDays(7),  // TTL for transit reservation
                $"TRANSIT-{shipment.ShipmentNo}");
            _context.InventoryReservations.Add(transitReservation);

            // 4.4 Create Inventory Ledger Log
            var ledger = InventoryLedger.Create(
                inventoryItem,
                InventoryLedgerReason.TransitReceived,
                qtyToReceive,
                receipt.Id.ToString(),
                "Receipt",
                request.OperatorId);
            
            _context.InventoryLedgers.Add(ledger);

            // Check and handle discrepancy
            if (qtyToReceive != shippedQty)
            {
                var discrepancy = new TransitDiscrepancy(
                    order.Id,
                    shipment.Id,
                    request.WarehouseId,
                    line.Sku,
                    shippedQty,
                    qtyToReceive,
                    shipment.Carrier ?? "N/A",
                    request.OperatorId
                );
                _context.TransitDiscrepancies.Add(discrepancy);
                // BUG-01 FIX: REMOVED line.UpdateRequestedQuantity(qtyToReceive)
                // RequestedQty must never be mutated — it is the single source of truth
                // for the original customer order. Discrepancy is tracked separately.

                // Publish integration event
                await _publishEndpoint.Publish(new EventBus.Messages.Events.TransitDiscrepancyDetectedIntegrationEvent(
                    discrepancy.Id,
                    order.Id,
                    shipment.Id,
                    request.WarehouseId,
                    line.Sku,
                    shippedQty,
                    qtyToReceive,
                    shippedQty - qtyToReceive,
                    shipment.Carrier ?? "N/A",
                    request.OperatorId
                ), cancellationToken);
            }

            // BUG-02 + BUG-04 FIX: Reset ALL progress counters for next-leg transit.
            // Old code only reset ShippedQty, leaving PickedQty/PackedQty stale from
            // the origin warehouse → caused wrong qtyToShip at next hub.
            line.ResetForNextTransitLeg(qtyToReceive);
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
