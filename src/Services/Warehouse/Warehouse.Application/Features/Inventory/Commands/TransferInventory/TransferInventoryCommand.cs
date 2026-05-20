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
        var destBin = await _context.Bins.FirstOrDefaultAsync(b => b.Id == request.DestinationBinId, cancellationToken);
        
        if (sourceBin != null && destBin != null)
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

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully transferred inventory and updated bins.");
        return Result<bool>.Success(true);
    }
}
