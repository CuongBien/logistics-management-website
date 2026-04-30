using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Errors;
using EventBus.Messages.Events;
using MassTransit;

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

        // 1. Tìm Bin đang chứa OrderId
        var bin = await _context.Bins
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
