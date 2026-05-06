using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using EventBus.Messages.Events;

namespace Warehouse.Application.Features.Inbound.Commands.ForceCloseReceipt;

public record ForceCloseReceiptCommand(Guid ReceiptId, string TenantId, string ClosedBySub) : IRequest<Result>;

public class ForceCloseReceiptCommandHandler : IRequestHandler<ForceCloseReceiptCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;

    public ForceCloseReceiptCommandHandler(IApplicationDbContext context, MassTransit.IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Result> Handle(ForceCloseReceiptCommand request, CancellationToken cancellationToken)
    {
        var receipt = await _context.InboundReceipts
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);

        if (receipt == null)
            return Result.Failure(new Error("InboundReceipt.NotFound", $"InboundReceipt with Id {request.ReceiptId} not found."));

        if (!string.Equals(receipt.TenantId, request.TenantId, StringComparison.Ordinal))
            return Result.Failure(new Error("InboundReceipt.ForbiddenTenant", $"Receipt '{request.ReceiptId}' does not belong to tenant '{request.TenantId}'."));

        // Only allow Force Close if it's Pending or PartiallyReceived
        if (receipt.Status != InboundReceiptStatus.Pending && receipt.Status != InboundReceiptStatus.PartiallyReceived)
        {
            return Result.Failure(new Error("InboundReceipt.CannotForceClose", $"Cannot force close receipt in status {receipt.Status}."));
        }

        // Force Close the receipt
        receipt.ForceClose();

        // Emit integration event so OMS knows this is "closed" despite not being fully received.
        var integrationEvent = new ShipmentReceivedIntegrationEvent(
            receipt.OrderId,
            receipt.WarehouseId.ToString(),
            request.ClosedBySub
        );

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
