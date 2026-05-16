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
    private readonly IOperatorAuthorizationService _authService;

    public SortOrderCommandHandler(
        IApplicationDbContext context, 
        IPublishEndpoint publishEndpoint,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _authService = authService;
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

        // 1. Tìm Bin đang chứa OrderId
        var bin = await _context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .FirstOrDefaultAsync(b => b.CurrentOrderId == request.OrderId, cancellationToken);

        if (bin == null)
        {
            return Result.Failure(Error.NotFound("Bin.NotFound", $"No bin found containing Order ID {request.OrderId}"));
        }

        // 2. Check RBAC Permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.CustomerId, 
            bin.WarehouseId, 
            bin.ZoneId, 
            "outbound:sort", 
            cancellationToken);

        if (!hasPermission)
        {
            return Result.Failure(new Error(
                "Operator.Forbidden",
                $"Operator '{request.CustomerId}' does not have permission 'outbound:sort' for warehouse '{bin.WarehouseId}' and zone '{bin.ZoneId}' (if applicable)."));
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
            outboundOrder = new OutboundOrder(
                request.OrderId, 
                request.TenantId, 
                request.CustomerId, 
                sourceWarehouseId, 
                orderNo: $"SORTED-{request.OrderId.ToString()[..8].ToUpper()}",
                destinationAddress: null,
                destinationCity: null,
                priority: 0,
                allowPartial: true);
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
