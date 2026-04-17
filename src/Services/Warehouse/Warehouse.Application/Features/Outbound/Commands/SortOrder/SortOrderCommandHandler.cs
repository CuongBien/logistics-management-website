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
        // 1. Tìm Bin đang chứa OrderId
        var bin = await _context.Bins
            .FirstOrDefaultAsync(b => b.CurrentOrderId == request.OrderId, cancellationToken);

        if (bin == null)
        {
            return Result.Failure(Error.NotFound("Bin.NotFound", $"No bin found containing Order ID {request.OrderId}"));
        }

        // 2. Bin.Status = Available (Giải phóng Bin)
        bin.Release();

        // 3. Publish Integration Event (Transactional Outbox will handle persistence)
        await _publishEndpoint.Publish(new ShipmentSortedIntegrationEvent(
            request.OrderId,
            request.DestinationHubId,
            DateTime.UtcNow), cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
