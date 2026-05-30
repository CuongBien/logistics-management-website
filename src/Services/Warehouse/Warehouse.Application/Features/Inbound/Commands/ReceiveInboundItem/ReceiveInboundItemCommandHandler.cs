using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using EventBus.Messages.Events;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;

public class ReceiveInboundItemCommandHandler : IRequestHandler<ReceiveInboundItemCommand, Result<ReceiveInboundItemResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;
    private readonly IOperatorAuthorizationService _authService;

    public ReceiveInboundItemCommandHandler(
        IApplicationDbContext context, 
        MassTransit.IPublishEndpoint publishEndpoint,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _authService = authService;
    }

    public async Task<Result<ReceiveInboundItemResponse>> Handle(ReceiveInboundItemCommand request, CancellationToken cancellationToken)
    {
        const int maxRetries = 3;
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                return await ProcessReceiveAsync(request, cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                if (attempt == maxRetries) throw;
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * attempt, cancellationToken);
            }
        }
        
        return Result<ReceiveInboundItemResponse>.Failure(new Error("Concurrency.Error", "Failed to receive item due to high concurrency. Please try again."));
    }

    private async Task<Result<ReceiveInboundItemResponse>> ProcessReceiveAsync(ReceiveInboundItemCommand request, CancellationToken cancellationToken)
    {
        // 1. Load InboundReceipt by ReceiptId with lines
        var receipt = await _context.InboundReceipts
            .Include(r => r.Lines)
                .ThenInclude(l => l.Allocations)
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);
            
        if (receipt == null)
            return Result<ReceiveInboundItemResponse>.Failure(new Error("InboundReceipt.NotFound", $"InboundReceipt with Id {request.ReceiptId} not found."));

        // 2. Validate SKU exists
        var isUnknown = false;
        var skuExists = await _context.ErpSkuMirrors
            .AnyAsync(x => x.TenantId == receipt.TenantId && x.SkuCode == request.SkuCode && x.Status == "active", cancellationToken);
        if (!skuExists)
        {
            isUnknown = true;
        }

        // 3. Validate OrderId belongs to this receipt
        if (receipt.OrderId != request.OrderId)
            return Result<ReceiveInboundItemResponse>.Failure(new Error("InboundReceipt.InvalidOrder", $"OrderId {request.OrderId} does not belong to receipt {request.ReceiptId}."));

        // 4. Load Bin by BinCode and WarehouseId (safety for multi-warehouse)
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.BinCode == request.BinCode && b.WarehouseId == receipt.WarehouseId, cancellationToken);
        if (bin == null)
            return Result<ReceiveInboundItemResponse>.Failure(new Error("Bin.NotFound", $"Bin with Code {request.BinCode} not found."));
        if (bin.Zone == null || bin.Zone.Block == null)
            return Result<ReceiveInboundItemResponse>.Failure(new Error("Bin.InvalidHierarchy", $"Bin with Code {request.BinCode} is missing zone/block hierarchy."));

        var hasPermission = await _authService.HasPermissionAsync(
            request.ScannedBy, 
            bin.WarehouseId, 
            bin.ZoneId, 
            "inbound:receive", 
            cancellationToken);

        if (!hasPermission)
        {
            return Result<ReceiveInboundItemResponse>.Failure(new Error(
                "Operator.Forbidden",
                $"Operator '{request.ScannedBy}' does not have permission 'inbound:receive' for warehouse '{bin.WarehouseId}' and zone '{bin.ZoneId}' (if applicable)."));
        }

        // Find or create line for this SKU
        var line = receipt.Lines.FirstOrDefault(l => l.Sku == request.SkuCode);
        
        var expectedQty = line?.ExpectedQuantity ?? 0;
        var receivedQty = line?.ReceivedQuantity ?? 0;
        var isOverage = (receivedQty + request.Quantity > expectedQty);

        var targetBin = bin;
        if (isUnknown || isOverage)
        {
            var quarantineBin = await _context.Bins
                .Include(b => b.Zone)
                .ThenInclude(z => z.Block)
                .FirstOrDefaultAsync(b => b.BinCode == "BIN-QUARANTINE" && b.WarehouseId == receipt.WarehouseId, cancellationToken);
                
            if (quarantineBin == null)
            {
                quarantineBin = new Bin(receipt.WarehouseId, bin.ZoneId, "BIN-QUARANTINE");
                _context.Bins.Add(quarantineBin);
                // Also set its Zone manually so the rest of the flow doesn't crash on .Zone.Block
                quarantineBin.GetType().GetProperty("Zone")?.SetValue(quarantineBin, bin.Zone);
            }
            targetBin = quarantineBin;
        }

        if (line == null)
        {
            // Blind receipt / Overage
            line = new InboundReceiptLine(receipt.Id, receipt.TenantId, receipt.CustomerId, request.SkuCode, expectedQuantity: request.Quantity);
            _context.InboundReceiptLines.Add(line);
            receipt.AddLine(line);
        }

        line.AddReceivedQuantity(request.Quantity);

        // Find or create Allocation
        var allocation = line.Allocations.FirstOrDefault(a => a.BinId == targetBin.Id);
        if (allocation != null)
        {
            allocation.AddQuantity(request.Quantity);
        }
        else
        {
            allocation = new InboundBinAllocation(line.Id, targetBin.Id, request.Quantity, receipt.TenantId);
            _context.InboundBinAllocations.Add(allocation);
        }

        // 4. Mark Bin as Occupied
        targetBin.AssignOrder(request.OrderId);
        
        // Mark receipt as received. (In a real system, we'd check if all lines are fully received)
        receipt.RecalculateStatus();

        // 4.5 Upsert InventoryItem
        var warehouseId = targetBin.Zone.Block.WarehouseId;
        var inventoryItem = await _context.InventoryItems
            .FirstOrDefaultAsync(i => i.WarehouseId == warehouseId 
                                   && i.TenantId == receipt.TenantId 
                                   && i.Sku == request.SkuCode 
                                   && i.BinId == targetBin.Id
                                   && i.LotNo == request.LotNo, cancellationToken);

        if (inventoryItem == null)
        {
            inventoryItem = InventoryItem.Create(request.SkuCode, request.Quantity, receipt.TenantId, receipt.CustomerId, warehouseId, targetBin.Id, request.LotNo, request.ExpiryDate);
            _context.InventoryItems.Add(inventoryItem);
        }
        else
        {
            inventoryItem.Restock(request.Quantity);
        }

        // 4.6 Log to Ledger
        var ledgerReason = (isUnknown || isOverage) ? "Overage Receipt" : "Receipt";
        var ledger = InventoryLedger.Create(
            inventoryItem,
            InventoryLedgerReason.InboundReceived,
            request.Quantity,
            request.ReceiptId.ToString(),
            ledgerReason,
            request.ScannedBy);
            
        _context.InventoryLedgers.Add(ledger);

        if (isUnknown || isOverage)
        {
            var discrepancy = new InboundDiscrepancy(
                receipt.Id,
                warehouseId,
                request.SkuCode,
                expectedQty,
                receivedQty + request.Quantity,
                request.ScannedBy,
                isUnknown ? "SKU not found in ERPMirror. Moved to Quarantine." : "Overage detected. Moved to Quarantine."
            );
            _context.InboundDiscrepancies.Add(discrepancy);
        }

        // 5. Publish integration event ONLY if the receipt is fully received
        if (receipt.Status == InboundReceiptStatus.Received)
        {
            var integrationEvent = new ShipmentReceivedIntegrationEvent(
                request.OrderId,
                warehouseId.ToString(),
                request.ScannedBy
            );

            await _publishEndpoint.Publish(integrationEvent, cancellationToken);
        }

        // --- CROSS DOCK INTERCEPTION ---
        bool isCrossDockSuggested = false;
        Guid? crossDockTaskId = null;
        bool isPutawaySuggested = false;
        Guid? putawayTaskId = null;
        string? suggestedPutawayBinCode = null;

        // Ensure this is not a Transit receipt
        bool isTransit = receipt.FinalDestinationWarehouseId.HasValue && receipt.FinalDestinationWarehouseId.Value != receipt.WarehouseId;

        if (!isTransit && !isUnknown && !isOverage)
        {
            // Find an outbound order that needs this SKU
            var starvedOrderLine = await _context.OutboundOrderLines
                .Include(l => l.OutboundOrder)
                .Where(l => l.OutboundOrder.WarehouseId == receipt.WarehouseId
                         && l.OutboundOrder.TenantId == receipt.TenantId
                         && l.OutboundOrder.CustomerId == receipt.CustomerId
                         && l.Sku == request.SkuCode
                         && (l.OutboundOrder.Status == OutboundOrderStatus.PendingAllocation || l.OutboundOrder.Status == OutboundOrderStatus.PartiallyAllocated)
                         && (l.RequestedQty - l.ReservedQty) > 0)
                .OrderBy(l => l.OutboundOrder.CreatedAt) // Oldest first (FIFO allocation)
                .FirstOrDefaultAsync(cancellationToken);

            if (starvedOrderLine != null)
            {
                var unallocatedDemand = starvedOrderLine.RequestedQty - starvedOrderLine.ReservedQty;
                var crossDockQty = Math.Min(request.Quantity, unallocatedDemand);

                // Find the Staging OUT bin
                var stagingOutBin = await _context.Bins
                    .Include(b => b.Zone)
                    .FirstOrDefaultAsync(b => b.WarehouseId == receipt.WarehouseId && b.Zone.ZoneType == ZoneType.Staging.ToString() && b.BinCode.Contains("OUT"), cancellationToken);

                if (stagingOutBin != null)
                {
                    var crossDockTask = new CrossDockTask(
                        receipt.TenantId,
                        receipt.WarehouseId,
                        receipt.Id,
                        starvedOrderLine.OutboundOrderId,
                        request.SkuCode,
                        crossDockQty,
                        targetBin.Id,
                        stagingOutBin.Id
                    );
                    _context.CrossDockTasks.Add(crossDockTask);
                    isCrossDockSuggested = true;
                    crossDockTaskId = crossDockTask.Id;
                }
            }
        }

        // --- DIRECTED PUTAWAY ---
        if (!isCrossDockSuggested && !isTransit && !isUnknown && !isOverage && 
            (targetBin.Zone.ZoneType == ZoneType.Staging.ToString() || targetBin.Zone.ZoneType == ZoneType.QC.ToString()))
        {
            // Smart Suggestion: find a bin in Storage containing this SKU and Lot
            var existingBinId = await _context.InventoryItems
                .Where(i => i.WarehouseId == receipt.WarehouseId 
                         && i.Sku == request.SkuCode 
                         && i.LotNo == request.LotNo)
                .Select(i => i.BinId)
                .FirstOrDefaultAsync(cancellationToken);

            Bin? suggestedBin = null;

            if (existingBinId != Guid.Empty)
            {
                suggestedBin = await _context.Bins.Include(b => b.Zone).FirstOrDefaultAsync(b => b.Id == existingBinId && b.Zone.ZoneType == ZoneType.Storage.ToString() && b.Status != BinStatus.Full.ToString(), cancellationToken);
            }

            if (suggestedBin == null)
            {
                // Fallback to any available empty bin in Storage
                suggestedBin = await _context.Bins
                    .Include(b => b.Zone)
                    .Where(b => b.WarehouseId == receipt.WarehouseId 
                             && b.Zone.ZoneType == ZoneType.Storage.ToString()
                             && b.Status == BinStatus.Available.ToString())
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (suggestedBin != null)
            {
                var putawayTask = new PutawayTask(
                    receipt.TenantId,
                    receipt.WarehouseId,
                    receipt.Id,
                    request.SkuCode,
                    request.LotNo,
                    request.Quantity,
                    targetBin.Id,
                    suggestedBin.Id
                );
                _context.PutawayTasks.Add(putawayTask);
                isPutawaySuggested = true;
                putawayTaskId = putawayTask.Id;
                suggestedPutawayBinCode = suggestedBin.BinCode;
            }
        }

        // 6. Save entity + outbox message atomically.
        await _context.SaveChangesAsync(cancellationToken);

        var response = new ReceiveInboundItemResponse(
            isCrossDockSuggested, 
            crossDockTaskId, 
            isPutawaySuggested, 
            putawayTaskId,
            suggestedPutawayBinCode
        );
        return Result<ReceiveInboundItemResponse>.Success(response);
    }
}