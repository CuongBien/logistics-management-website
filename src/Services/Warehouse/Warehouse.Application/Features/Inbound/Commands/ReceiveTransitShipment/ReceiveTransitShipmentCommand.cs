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
    Dictionary<string, int>? ReceivedItems = null,
    string? BinCode = null
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

        bool isFinalDestination = (request.WarehouseId.ToString() == order.PartnerId);

        // 2. Find the active dispatched Shipment containing this order
        var shipmentOrder = await _context.ShipmentOrders
            .Include(so => so.Shipment)
            .FirstOrDefaultAsync(so => so.OutboundOrderId == order.Id && (so.Shipment.Status == ShipmentStatus.Shipped || so.Shipment.Status == ShipmentStatus.Delivered), cancellationToken);

        if (shipmentOrder == null)
        {
            return Result<bool>.Failure(Error.NotFound("Shipment.NotFound", $"No shipped Shipment found containing Order {request.OrderId}."));
        }

        var shipment = shipmentOrder.Shipment;

        // Idempotency check
        if (shipment.Status == ShipmentStatus.Delivered && order.WarehouseId == request.WarehouseId)
        {
            _logger.LogInformation("Transit shipment for Order {OrderId} was already delivered to {WarehouseId}.", request.OrderId, request.WarehouseId);
            return Result<bool>.Success(true);
        }

        // 3. Resolve Bin
        var targetBinCode = string.IsNullOrWhiteSpace(request.BinCode) ? "BIN-A1-01" : request.BinCode;
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.BinCode == targetBinCode && b.WarehouseId == request.WarehouseId, cancellationToken);

        if (bin == null)
        {
            return Result<bool>.Failure(Error.NotFound("Bin.NotFound", $"Target Bin {targetBinCode} not found at warehouse {request.WarehouseId}."));
        }

        // 4. Find or create Quarantine Bin (BIN-QUARANTINE) if needed
        var quarantineBin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.BinCode == "BIN-QUARANTINE" && b.WarehouseId == request.WarehouseId, cancellationToken);

        if (quarantineBin == null)
        {
            quarantineBin = new Bin(request.WarehouseId, bin.ZoneId, "BIN-QUARANTINE");
            _context.Bins.Add(quarantineBin);
            // Also set its Zone manually so the rest of the flow doesn't crash on .Zone.Block
            quarantineBin.GetType().GetProperty("Zone")?.SetValue(quarantineBin, bin.Zone);
        }

        // 5. Find or create temporary Inbound Receipt representing transit reception
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

        // 6. Two-Way Reconciliation Logic
        var receivedItems = request.ReceivedItems != null 
            ? new Dictionary<string, int>(request.ReceivedItems) 
            : new Dictionary<string, int>();

        var expectedSkus = order.Lines.Select(l => l.Sku).ToHashSet();
        var allSkus = new HashSet<string>(expectedSkus);
        foreach (var sku in receivedItems.Keys)
        {
            allSkus.Add(sku);
        }

        // Check ErpSkuMirror for all SKUs
        var validSkus = await _context.ErpSkuMirrors
            .Where(e => e.TenantId == order.TenantId && allSkus.Contains(e.SkuCode))
            .Select(e => e.SkuCode)
            .ToListAsync(cancellationToken);

        var validSkuSet = new HashSet<string>(validSkus);
        bool hasUnknownSkus = false;
        var unknownSkuList = new List<string>();

        foreach (var sku in allSkus)
        {
            if (!validSkuSet.Contains(sku))
            {
                hasUnknownSkus = true;
                unknownSkuList.Add(sku);
            }
        }

        // Phase 1: Process Expected Items
        foreach (var line in order.Lines)
        {
            int shippedQty = line.ShippedQty > 0 ? line.ShippedQty : line.RequestedQty;
            int qtyToReceive = shippedQty;

            if (receivedItems.TryGetValue(line.Sku, out var customQty))
            {
                qtyToReceive = customQty;
                receivedItems.Remove(line.Sku); // Mark as processed
            }
            else if (request.ReceivedItems != null)
            {
                // If ReceivedItems dictionary was provided but this SKU is missing, it means 0 received
                qtyToReceive = 0;
            }

            if (qtyToReceive < 0)
            {
                return Result<bool>.Failure(new Error("TransitReceive.InvalidQuantity", $"Received quantity for SKU {line.Sku} cannot be negative."));
            }

            if (qtyToReceive > 0)
            {
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

                var allocation = new InboundBinAllocation(receiptLine.Id, bin.Id, qtyToReceive, order.TenantId);
                _context.InboundBinAllocations.Add(allocation);

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

                if (!isFinalDestination)
                {
                    inventoryItem.ReserveStock(qtyToReceive);
                    var transitReservation = InventoryReservation.Create(
                        inventoryItem.Id,
                        order.Id.ToString(),
                        ReservationType.OutboundOrder,
                        qtyToReceive,
                        TimeSpan.FromDays(7),
                        $"TRANSIT-{shipment.ShipmentNo}");
                    _context.InventoryReservations.Add(transitReservation);
                }

                var ledger = InventoryLedger.Create(
                    inventoryItem,
                    InventoryLedgerReason.TransitReceived,
                    qtyToReceive,
                    receipt.Id.ToString(),
                    "Receipt",
                    request.OperatorId);
                
                _context.InventoryLedgers.Add(ledger);
            }

            // Shortage Discrepancy
            if (qtyToReceive < shippedQty)
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

            line.ResetForNextTransitLeg(qtyToReceive);
        }

        // Phase 2: Process Overage / Unexpected Items
        foreach (var kvp in receivedItems)
        {
            var sku = kvp.Key;
            var overageQty = kvp.Value;
            if (overageQty <= 0) continue;

            var isUnknown = !validSkuSet.Contains(sku);
            var targetOverageBin = isUnknown ? quarantineBin : bin;

            var receiptLine = new InboundReceiptLine(receipt.Id, order.TenantId, order.CustomerId, sku, expectedQuantity: overageQty);
            receiptLine.AddReceivedQuantity(overageQty);
            _context.InboundReceiptLines.Add(receiptLine);
            receipt.AddLine(receiptLine);

            var allocation = new InboundBinAllocation(receiptLine.Id, targetOverageBin.Id, overageQty, order.TenantId);
            _context.InboundBinAllocations.Add(allocation);

            var inventoryItem = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.WarehouseId == request.WarehouseId 
                                       && i.TenantId == order.TenantId 
                                       && i.Sku == sku 
                                       && i.BinId == targetOverageBin.Id, cancellationToken);

            if (inventoryItem == null)
            {
                inventoryItem = InventoryItem.Create(sku, overageQty, order.TenantId, order.CustomerId, request.WarehouseId, targetOverageBin.Id);
                _context.InventoryItems.Add(inventoryItem);
            }
            else
            {
                inventoryItem.Restock(overageQty);
            }

            var ledger = InventoryLedger.Create(
                inventoryItem,
                InventoryLedgerReason.TransitReceived,
                overageQty,
                receipt.Id.ToString(),
                "Overage Receipt",
                request.OperatorId);
            _context.InventoryLedgers.Add(ledger);

            var discrepancy = new TransitDiscrepancy(
                order.Id,
                shipment.Id,
                request.WarehouseId,
                sku,
                0, // ShippedQty = 0
                overageQty,
                shipment.Carrier ?? "N/A",
                request.OperatorId,
                isUnknown ? "SKU not found in ERPMirror. Moved to Quarantine." : "Overage detected"
            );
            _context.TransitDiscrepancies.Add(discrepancy);

            await _publishEndpoint.Publish(new EventBus.Messages.Events.TransitDiscrepancyDetectedIntegrationEvent(
                discrepancy.Id,
                order.Id,
                shipment.Id,
                request.WarehouseId,
                sku,
                0,
                overageQty,
                -overageQty,
                shipment.Carrier ?? "N/A",
                request.OperatorId
            ), cancellationToken);
        }

        // 7. Update States
        receipt.RecalculateStatus();
        order.UpdateWarehouse(request.WarehouseId);
        
        if (isFinalDestination)
        {
            order.UpdateStatus(OutboundOrderStatus.Delivered);
            if (!string.IsNullOrWhiteSpace(request.BinCode))
            {
                bin.AssignOrder(order.OrderId);
            }
        }
        else
        {
            order.UpdateStatus(OutboundOrderStatus.Packed);
        }

        shipment.Deliver();

        await _context.SaveChangesAsync(cancellationToken);

        if (hasUnknownSkus)
        {
            var unknownList = string.Join(", ", unknownSkuList);
            _logger.LogWarning("Transit received with unknown SKUs: {UnknownList}. Items moved to quarantine.", unknownList);
            return Result<bool>.Failure(new Error("TransitReceive.UnknownSkuQuarantine", $"Processed with warnings. Unknown SKUs detected and moved to quarantine: {unknownList}"));
        }

        _logger.LogInformation("Successfully received Transit Package for Order {OrderId} at Warehouse {WarehouseId}.", request.OrderId, request.WarehouseId);
        return Result<bool>.Success(true);
    }
}
