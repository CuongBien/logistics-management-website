using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using EventBus.Messages.Events;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;

public class ReceiveInboundItemCommandHandler : IRequestHandler<ReceiveInboundItemCommand, Result>
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

    public async Task<Result> Handle(ReceiveInboundItemCommand request, CancellationToken cancellationToken)
    {
        var skuExists = await _context.ErpSkuMirrors
            .AnyAsync(x => x.TenantId == request.TenantId && x.SkuCode == request.SkuCode && x.Status == "active", cancellationToken);
        if (!skuExists)
        {
            return Result.Failure(new Error(
                "ErpSkuMirror.MissingMapping",
                $"Cannot receive inbound item because SKU '{request.SkuCode}' is not mapped for tenant '{request.TenantId}'."));
        }

        // 1. Load InboundReceipt by ReceiptId with lines
        var receipt = await _context.InboundReceipts
            .Include(r => r.Lines)
                .ThenInclude(l => l.Allocations)
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);
            
        if (receipt == null)
            return Result.Failure(new Error("InboundReceipt.NotFound", $"InboundReceipt with Id {request.ReceiptId} not found."));

        if (receipt.Status == InboundReceiptStatus.Completed || receipt.Status == InboundReceiptStatus.CompletedWithExceptions)
        {
            return Result.Failure(new Error(
                "InboundReceipt.Immutable",
                $"Cannot receive on receipt in status '{receipt.Status}'. Use a compensating workflow if a correction is required."));
        }

        if (!string.Equals(receipt.TenantId, request.TenantId, StringComparison.Ordinal))
        {
            return Result.Failure(new Error(
                "InboundReceipt.ForbiddenTenant",
                $"Receipt '{request.ReceiptId}' does not belong to tenant '{request.TenantId}'."));
        }

        // 2. Validate OrderId belongs to this receipt (using SourceRef)
        if (receipt.SourceRef != request.OrderId.ToString())
            return Result.Failure(new Error("InboundReceipt.InvalidOrder", $"OrderId {request.OrderId} does not belong to receipt {request.ReceiptId}."));

        // 3. Load Bin by BinCode and WarehouseId
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.BinCode == request.BinCode && b.WarehouseId == receipt.WarehouseId, cancellationToken);
        if (bin == null)
            return Result.Failure(new Error("Bin.NotFound", $"Bin with Code {request.BinCode} not found."));
        
        // 4. Check Authorization
        var hasPermission = await _authService.HasPermissionAsync(
            request.ScannedBy, 
            bin.WarehouseId, 
            bin.ZoneId, 
            "inbound:receive", 
            cancellationToken);

        if (!hasPermission)
        {
            return Result.Failure(new Error(
                "Operator.Forbidden",
                $"Operator '{request.ScannedBy}' does not have permission 'inbound:receive' for warehouse '{bin.WarehouseId}'."));
        }

        // Find or create line for this SKU
        var line = receipt.Lines.FirstOrDefault(l => l.SkuCode == request.SkuCode);
        if (line == null)
        {
            // Blind receipt scenario: line wasn't in ASN
            line = new InboundReceiptLine(receipt.Id, receipt.Lines.Count + 1, request.TenantId, receipt.CustomerId, request.SkuCode, "EA", request.Quantity);
            _context.InboundReceiptLines.Add(line);
            receipt.AddLine(line);
        }

        line.Receive(request.Quantity);

        var sumAllocated = line.Allocations.Sum(a => a.AllocatedQty);
        var projectedTotal = sumAllocated + request.Quantity;
        if (projectedTotal > line.ReceivedQty)
        {
            return Result.Failure(new Error(
                "InboundBinAllocation.ExceedsReceived",
                $"Allocation total ({projectedTotal}) would exceed received quantity ({line.ReceivedQty}) for SKU '{request.SkuCode}'."));
        }

        var allocation = line.Allocations.FirstOrDefault(a => a.BinId == bin.Id);
        if (allocation != null)
        {
            allocation.AddQuantity(request.Quantity);
        }
        else
        {
            allocation = new InboundBinAllocation(line.Id, bin.Id, request.Quantity, request.TenantId);
            line.AddAllocation(allocation);
            _context.InboundBinAllocations.Add(allocation);
        }

        // 5. Mark Bin as Occupied
        bin.AssignOrder(request.OrderId);
        
        // 6. Upsert InventoryItem
        var warehouseId = bin.Zone.Block.WarehouseId;
        var inventoryItem = await _context.InventoryItems
            .FirstOrDefaultAsync(i => i.WarehouseId == warehouseId 
                                   && i.TenantId == request.TenantId 
                                   && i.Sku == request.SkuCode 
                                   && i.BinId == bin.Id, cancellationToken);

        if (inventoryItem == null)
        {
            inventoryItem = InventoryItem.Create(request.SkuCode, request.Quantity, request.TenantId, receipt.CustomerId, warehouseId, bin.Id);
            _context.InventoryItems.Add(inventoryItem);
        }
        else
        {
            inventoryItem.Restock(request.Quantity);
        }

        // 7. Log to Ledger
        var ledger = InventoryLedger.Create(
            inventoryItem,
            InventoryLedgerReason.InboundReceived,
            request.Quantity,
            request.ReceiptId.ToString(),
            "Receipt",
            request.ScannedBy);
            
        _context.InventoryLedgers.Add(ledger);

        // 8. Ensure receipt status is updated. 
        // This triggers InboundReceiptCompletedDomainEvent if all lines are completed.
        receipt.RecalculateStatus();

        // 9. Save entity + outbox message atomically.
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
