using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Outbound.Commands.ProcessReturnDisposition;

public record ProcessReturnDispositionCommand(
    Guid WarehouseId,
    string Sku,
    int Quantity,
    ReturnCondition Condition,
    string? TargetBinCode,
    string? ReferenceId,
    string? ReferenceType,
    string Notes,
    string OperatorId,
    string TenantId,
    string CustomerId) : IRequest<Result<bool>>;

public sealed class ProcessReturnDispositionCommandHandler : IRequestHandler<ProcessReturnDispositionCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ProcessReturnDispositionCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public ProcessReturnDispositionCommandHandler(
        IApplicationDbContext context,
        ILogger<ProcessReturnDispositionCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(ProcessReturnDispositionCommand request, CancellationToken cancellationToken)
    {
        // Check permission (Re-use inventory:transfer or maybe define a new one if needed, we'll use inventory:transfer for now)
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            request.WarehouseId,
            null,
            "inventory:transfer",
            cancellationToken);

        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inventory:transfer' for warehouse '{request.WarehouseId}'."));
        }

        if (request.Quantity <= 0)
            return Result<bool>.Failure(new Error("InvalidQuantity", "Quantity must be greater than zero."));

        var returnBin = await _context.Bins
            .FirstOrDefaultAsync(b => b.BinCode == "BIN-RETURN" && b.WarehouseId == request.WarehouseId, cancellationToken);

        if (returnBin == null)
            return Result<bool>.Failure(Error.NotFound("Bin.NotFound", "BIN-RETURN not found in warehouse."));

        // Fetch Source Item
        var sourceItem = await _context.InventoryItems
            .FirstOrDefaultAsync(i => 
                i.TenantId == request.TenantId &&
                i.WarehouseId == request.WarehouseId &&
                i.BinId == returnBin.Id &&
                i.Sku == request.Sku, cancellationToken);

        if (sourceItem == null || sourceItem.QuantityOnHand < request.Quantity)
        {
            return Result<bool>.Failure(new Error("Inventory.InsufficientStock", $"Not enough stock in BIN-RETURN for SKU {request.Sku}."));
        }

        // Determine Target Bin based on condition
        string finalTargetBinCode = request.Condition == ReturnCondition.Damaged ? "BIN-SCRAP" : (request.TargetBinCode ?? "BIN-RETURN");
        
        if (finalTargetBinCode == "BIN-RETURN")
        {
            return Result<bool>.Failure(new Error("InvalidTarget", "For 'Good' condition, a TargetBinCode other than BIN-RETURN must be provided."));
        }

        var destBin = await _context.Bins
            .FirstOrDefaultAsync(b => b.BinCode == finalTargetBinCode && b.WarehouseId == request.WarehouseId, cancellationToken);

        if (destBin == null)
            return Result<bool>.Failure(Error.NotFound("Bin.NotFound", $"Destination bin {finalTargetBinCode} not found in warehouse."));

        // Deduct from Source
        sourceItem.Deduct(request.Quantity);

        var ledgerReason = request.Condition == ReturnCondition.Good 
            ? InventoryLedgerReason.ReturnDispositionRestock 
            : InventoryLedgerReason.ReturnDispositionScrap;

        var sourceLedger = InventoryLedger.Create(
            sourceItem,
            ledgerReason,
            -request.Quantity,
            request.ReferenceId,
            request.ReferenceType ?? "QCDisposition",
            request.OperatorId,
            request.Notes);
        
        _context.InventoryLedgers.Add(sourceLedger);

        // Upsert Destination Item
        var destItem = await _context.InventoryItems
            .FirstOrDefaultAsync(i => 
                i.TenantId == request.TenantId &&
                i.WarehouseId == request.WarehouseId &&
                i.BinId == destBin.Id &&
                i.Sku == request.Sku, cancellationToken);

        if (destItem == null)
        {
            destItem = InventoryItem.Create(request.Sku, request.Quantity, request.TenantId, request.CustomerId, request.WarehouseId, destBin.Id);
            _context.InventoryItems.Add(destItem);
        }
        else
        {
            destItem.Restock(request.Quantity);
        }

        var destLedger = InventoryLedger.Create(
            destItem,
            ledgerReason,
            request.Quantity,
            request.ReferenceId,
            request.ReferenceType ?? "QCDisposition",
            request.OperatorId,
            request.Notes);
            
        _context.InventoryLedgers.Add(destLedger);

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Successfully processed QC Disposition for {Sku}. Condition: {Condition}. Moved to {Bin}", request.Sku, request.Condition, finalTargetBinCode);

        return Result<bool>.Success(true);
    }
}
