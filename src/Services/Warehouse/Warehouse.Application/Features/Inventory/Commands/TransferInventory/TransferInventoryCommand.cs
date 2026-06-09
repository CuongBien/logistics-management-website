using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Commands.TransferInventory;

public class TransferInventoryCommand : IRequest<Result<bool>>
{
    public string TenantId { get; set; } = string.Empty;
    public string CustomerId { get; set; } = string.Empty;
    public string OperatorId { get; set; } = string.Empty;
    public Guid WarehouseId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public Guid SourceBinId { get; set; }
    public Guid DestinationBinId { get; set; }
    public int Quantity { get; set; }
}

public class TransferInventoryCommandHandler : IRequestHandler<TransferInventoryCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<TransferInventoryCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public TransferInventoryCommandHandler(
        IApplicationDbContext context,
        ILogger<TransferInventoryCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(TransferInventoryCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Transferring {Qty} of SKU {Sku} from Bin {SourceBin} to Bin {DestBin} in Warehouse {Wh}",
            request.Quantity, request.Sku, request.SourceBinId, request.DestinationBinId, request.WarehouseId);

        // 1. Authorization
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            request.WarehouseId,
            null,
            "inventory:transfer",
            cancellationToken);

        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Operator.Forbidden", "Does not have 'inventory:transfer' permission."));
        }

        if (request.Quantity <= 0)
        {
            return Result<bool>.Failure(new Error("Inventory.InvalidQuantity", "Transfer quantity must be greater than zero."));
        }

        if (request.SourceBinId == request.DestinationBinId)
        {
            return Result<bool>.Failure(new Error("Inventory.SameBin", "Source and destination bins cannot be the same."));
        }

        // Fetch Destination Bin
        var destBin = await _context.Bins.FirstOrDefaultAsync(b => b.Id == request.DestinationBinId, cancellationToken);
        if (destBin == null)
        {
            return Result<bool>.Failure(new Error("Inventory.DestinationBinNotFound", "Destination bin not found."));
        }

        // Validate Bin Status
        if (destBin.Status == BinStatus.Maintenance.ToString() || 
            destBin.Status == BinStatus.Locked.ToString() || 
            destBin.Status == BinStatus.Disabled.ToString() ||
            destBin.Status == BinStatus.Full.ToString())
        {
            return Result<bool>.Failure(new Error("Inventory.InvalidBinStatus", $"Destination bin is in {destBin.Status} status."));
        }

        // Capacity Check
        var currentInventory = await _context.InventoryItems
            .Where(i => i.WarehouseId == request.WarehouseId && i.BinId == destBin.Id)
            .ToListAsync(cancellationToken);
        
        var currentQty = currentInventory.Sum(i => i.QuantityOnHand);
        var currentWeight = currentQty * 0.5;
        var currentVolume = currentQty * 0.001;

        var additionalWeight = request.Quantity * 0.5;
        var additionalVolume = request.Quantity * 0.001;

        if (destBin.MaxQuantity.HasValue && currentQty + request.Quantity > destBin.MaxQuantity.Value)
        {
            return Result<bool>.Failure(new Error("Inventory.BinOverCapacity", $"Destination bin would exceed max quantity limit of {destBin.MaxQuantity.Value}. Current: {currentQty}, Adding: {request.Quantity}"));
        }
        
        if (destBin.MaxWeight.HasValue && currentWeight + additionalWeight > destBin.MaxWeight.Value)
        {
            return Result<bool>.Failure(new Error("Inventory.BinOverWeight", $"Destination bin would exceed max weight limit of {destBin.MaxWeight.Value} kg. Current: {currentWeight} kg, Adding: {additionalWeight} kg"));
        }

        if (destBin.MaxVolume.HasValue && currentVolume + additionalVolume > destBin.MaxVolume.Value)
        {
            return Result<bool>.Failure(new Error("Inventory.BinOverVolume", $"Destination bin would exceed max volume limit of {destBin.MaxVolume.Value} m3. Current: {currentVolume} m3, Adding: {additionalVolume} m3"));
        }

        // 2. Fetch Source Item
        var sourceItem = await _context.InventoryItems
            .FirstOrDefaultAsync(i => 
                i.TenantId == request.TenantId &&
                i.CustomerId == request.CustomerId &&
                i.WarehouseId == request.WarehouseId &&
                i.BinId == request.SourceBinId &&
                i.Sku == request.Sku, cancellationToken);

        if (sourceItem == null)
        {
            return Result<bool>.Failure(new Error("Inventory.SourceNotFound", "Source inventory item not found."));
        }

        if (sourceItem.AvailableQty < request.Quantity)
        {
            return Result<bool>.Failure(new Error("Inventory.InsufficientStock", $"Not enough available stock in source bin. Requested: {request.Quantity}, Available: {sourceItem.AvailableQty}"));
        }

        // 3. Deduct from Source
        sourceItem.Deduct(request.Quantity);
        
        var sourceLedger = InventoryLedger.Create(
            sourceItem,
            InventoryLedgerReason.InternalTransfer,
            -request.Quantity,
            request.DestinationBinId.ToString(),
            "TransferOut",
            request.OperatorId);
        
        _context.InventoryLedgers.Add(sourceLedger);

        // 4. Upsert Destination Item
        var destItem = await _context.InventoryItems
            .FirstOrDefaultAsync(i => 
                i.TenantId == request.TenantId &&
                i.CustomerId == request.CustomerId &&
                i.WarehouseId == request.WarehouseId &&
                i.BinId == request.DestinationBinId &&
                i.Sku == request.Sku, cancellationToken);

        if (destItem == null)
        {
            destItem = InventoryItem.Create(request.Sku, request.Quantity, request.TenantId, request.CustomerId, request.WarehouseId, request.DestinationBinId);
            _context.InventoryItems.Add(destItem);
        }
        else
        {
            destItem.Restock(request.Quantity);
        }

        var destLedger = InventoryLedger.Create(
            destItem,
            InventoryLedgerReason.InternalTransfer,
            request.Quantity,
            request.SourceBinId.ToString(),
            "TransferIn",
            request.OperatorId);
            
        _context.InventoryLedgers.Add(destLedger);

        // 5. Update Bins
        var sourceBin = await _context.Bins.FirstOrDefaultAsync(b => b.Id == request.SourceBinId, cancellationToken);
        
        if (sourceBin != null)
        {
            var orderId = sourceBin.CurrentOrderId;
            
            // If the source bin is now empty, release it
            if (sourceItem.QuantityOnHand == 0)
            {
                sourceBin.Release();
            }
            
            // Assign the destination bin to the order
            if (orderId.HasValue)
            {
                destBin.AssignOrder(orderId.Value);
            }
        }

        // Update Bin Status to Full if capacity reached
        var newQty = currentQty + request.Quantity;
        if (destBin.MaxQuantity.HasValue && newQty >= destBin.MaxQuantity.Value)
        {
            destBin.UpdateStatus(BinStatus.Full);
        }

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully transferred inventory and updated bins.");
        return Result<bool>.Success(true);
    }
}
