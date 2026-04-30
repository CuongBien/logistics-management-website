using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using EventBus.Messages.Events;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;

public class ReceiveInboundItemCommandHandler : IRequestHandler<ReceiveInboundItemCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;

    public ReceiveInboundItemCommandHandler(IApplicationDbContext context, MassTransit.IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
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

        // 1. Load InboundReceipt by ReceiptId
        var receipt = await _context.InboundReceipts
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);
            
        if (receipt == null)
            return Result.Failure(new Error("InboundReceipt.NotFound", $"InboundReceipt with Id {request.ReceiptId} not found."));

        if (!string.Equals(receipt.TenantId, request.TenantId, StringComparison.Ordinal))
        {
            return Result.Failure(new Error(
                "InboundReceipt.ForbiddenTenant",
                $"Receipt '{request.ReceiptId}' does not belong to tenant '{request.TenantId}'."));
        }

        // 2. Validate OrderId belongs to this receipt
        if (receipt.OrderId != request.OrderId)
            return Result.Failure(new Error("InboundReceipt.InvalidOrder", $"OrderId {request.OrderId} does not belong to receipt {request.ReceiptId}."));

        // 3. Load Bin by BinCode
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.BinCode == request.BinCode, cancellationToken);
        if (bin == null)
            return Result.Failure(new Error("Bin.NotFound", $"Bin with Code {request.BinCode} not found."));
        if (bin.Zone == null || bin.Zone.Block == null)
            return Result.Failure(new Error("Bin.InvalidHierarchy", $"Bin with Code {request.BinCode} is missing zone/block hierarchy."));

        var hasWarehouseScope = await _context.OperatorProfiles
            .Where(x => x.TenantId == request.TenantId && x.OperatorSub == request.ScannedBy && x.IsActive)
            .SelectMany(x => x.WarehouseScopes)
            .AnyAsync(x => x.WarehouseId == bin.Zone.Block.WarehouseId, cancellationToken);
        if (!hasWarehouseScope)
        {
            return Result.Failure(new Error(
                "Operator.ForbiddenWarehouseScope",
                $"Operator '{request.ScannedBy}' is not allowed to receive into warehouse '{bin.Zone.Block.WarehouseId}'."));
        }

        // 4. Mark Bin as Occupied
        bin.AssignOrder(request.OrderId);
        
        // Mark receipt as received.
        receipt.MarkReceived();

        // 5. Publish integration event first so EF outbox can persist it in the same SaveChanges.
        var integrationEvent = new ShipmentReceivedIntegrationEvent(
            request.OrderId,
            bin.Zone.Block.WarehouseId.ToString(),
            request.ScannedBy
        );

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);

        // 6. Save entity + outbox message atomically.
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}