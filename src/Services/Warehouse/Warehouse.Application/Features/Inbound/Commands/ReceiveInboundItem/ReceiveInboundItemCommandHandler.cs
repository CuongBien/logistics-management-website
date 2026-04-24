using System.Linq;
using Microsoft.EntityFrameworkCore;

public class ReceiveInboundItemCommandHandler : IRequestHandler<ReceiveInboundItemCommand>
{
    private readonly IApplicationDbContext _context;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;

    public ReceiveInboundItemCommandHandler(IApplicationDbContext context, MassTransit.IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Unit> Handle(ReceiveInboundItemCommand request, CancellationToken cancellationToken)
    {
        // 1. Load InboundReceipt by ReceiptId
        var receipt = await _context.InboundReceipts
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);
        if (receipt == null)
            throw new NotFoundException($"InboundReceipt with Id {request.ReceiptId} not found.");
        // 2. Validate OrderId belongs to this receipt
        if (!receipt.OrderIds.Contains(request.OrderId))
            throw new ValidationException($"OrderId {request.OrderId} does not belong to receipt {request.ReceiptId}.");
        // 3. Load Bin by BinCode
        var bin = await _context.Bins.FirstOrDefaultAsync(b => b.Code == request.BinCode, cancellationToken);
        if (bin == null)
            throw new NotFoundException($"Bin with Code {request.BinCode} not found.");
        // 4. Mark Bin.Status = Occupied
        bin.Status = BinStatus.Occupied;
        // 5. Create new InboundItem with BinId, OrderId, ScannedBy, ScannedAt
        if (receipt.Items.Any(i => i.OrderId == request.OrderId))
            throw new ValidationException($"Order {request.OrderId} already scanned.");
        var inboundItem = new InboundItem
        {
            Id = Guid.NewGuid(),
            BinId = bin.Id,
            OrderId = request.OrderId,
            ScannedBy = request.ScannedBy,
            ScannedAt = DateTime.UtcNow
        };
        // 6. Add InboundItem to InboundReceipt
        receipt.Items.Add(inboundItem);
        // 7. Save changes using IApplicationDbContext
        await _context.SaveChangesAsync(cancellationToken);

        // 8. Publish ShipmentReceivedIntegrationEvent (will be recorded in Outbox)
        var integrationEvent = new Warehouse.Application.Features.Inbound.Events.ShipmentReceivedIntegrationEvent(
            receipt.Id,
            request.OrderId,
            request.BinCode,
            inboundItem.ScannedAt
        );

        await _publishEndpoint.Publish<Warehouse.Application.Features.Inbound.Events.ShipmentReceivedIntegrationEvent>(integrationEvent, cancellationToken);

        return Unit.Value;
    }
}