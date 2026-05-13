using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Errors;
using EventBus.Messages.Events;
using MassTransit;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Outbound.Commands.SortOrder;

public class SortOrderCommandHandler : IRequestHandler<SortOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;

    public SortOrderCommandHandler(IApplicationDbContext context, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Result> Handle(SortOrderCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            return Result.Failure(new Error("Tenant.Missing", "TenantId is required for sorting operation."));
        }

        if (string.IsNullOrWhiteSpace(request.CustomerId))
        {
            return Result.Failure(new Error("Customer.Missing", "CustomerId is required for sorting operation."));
        }

        var hasWarehouseScope = await _context.OperatorProfiles
            .Where(x => x.TenantId == request.TenantId && x.OperatorSub == request.CustomerId && x.IsActive)
            .SelectMany(x => x.WarehouseScopes)
            .AnyAsync(x => x.WarehouseId == request.DestinationWarehouseId, cancellationToken);
        if (!hasWarehouseScope)
        {
            return Result.Failure(new Error(
                "Operator.ForbiddenWarehouseScope",
                $"Operator '{request.CustomerId}' is not allowed to sort into warehouse '{request.DestinationWarehouseId}'."));
        }

        // 1. Tìm Bin đang chứa OrderId
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.CurrentOrderId == request.OrderId, cancellationToken);

        if (bin == null)
        {
            return Result.Failure(Error.NotFound("Bin.NotFound", $"No bin found containing Order ID {request.OrderId}"));
        }

        // 2. Bin.Status = Available (Giải phóng Bin)
        bin.Release();

        var sourceShipmentNo = request.SourceShipmentNo;
        if (string.IsNullOrWhiteSpace(sourceShipmentNo))
        {
            sourceShipmentNo = $"ASN-{request.OrderId:N}";
        }

        // 2.1 W2: Create OutboundOrder and Shipment (Overview)
        var sourceWarehouseId = bin.Zone.Block.WarehouseId;

        var outboundOrder = await _context.OutboundOrders
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId, cancellationToken);
            
        if (outboundOrder == null)
        {
            // Sort-created outbound order: we don't have specific line items yet,
            // but the constructor requires at least one. Use a placeholder.
            var lineSpecs = new List<(string SkuCode, int RequestedQty, string? Uom)>
            {
                ("SORTED-ORDER", 1, "EA")
            };
            outboundOrder = new OutboundOrder(request.OrderId, sourceWarehouseId, request.TenantId, request.CustomerId, lineSpecs);
            outboundOrder.UpdateStatus(OutboundOrderStatus.Shipped);
            _context.OutboundOrders.Add(outboundOrder);

            var shipment = new Shipment(request.TenantId, request.CustomerId, sourceShipmentNo, sourceWarehouseId, DestinationType.Warehouse, request.DestinationWarehouseId.ToString());
            shipment.Dispatch();
            _context.Shipments.Add(shipment);
        }

        // 3. Publish Integration Event (Transactional Outbox will handle persistence)
        await _publishEndpoint.Publish(new ShipmentSortedIntegrationEvent(
            request.OrderId,
            request.DestinationWarehouseId.ToString(),
            DateTime.UtcNow,
            request.TenantId,
            request.CustomerId,
            sourceShipmentNo), cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
