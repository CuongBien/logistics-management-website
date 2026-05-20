using EventBus.Messages.Events;
using MassTransit;
using MediatR;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Events;

namespace Warehouse.Application.Features.Inbound.EventHandlers;

public class InboundReceiptCompletedEventHandler : INotificationHandler<InboundReceiptCompletedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;

    public InboundReceiptCompletedEventHandler(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task Handle(InboundReceiptCompletedDomainEvent notification, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(notification.SourceRef, out var orderId))
        {
            return;
        }

        if (notification.FinalStatus == InboundReceiptStatus.CompletedWithExceptions)
        {
            var discrepancyLines = notification.Discrepancies
                .Select(d => new DiscrepancyLineItem(
                    d.SkuCode,
                    d.ExpectedQty,
                    d.ReceivedQty,
                    d.RejectedQty,
                    d.ShortageQty,
                    d.RejectionReason))
                .ToList();

            await _publishEndpoint.Publish(new InboundDiscrepancyDetectedIntegrationEvent(
                orderId,
                notification.WarehouseId.ToString(),
                discrepancyLines
            ), cancellationToken);
        }
        else if (notification.FinalStatus == InboundReceiptStatus.Completed)
        {
            await _publishEndpoint.Publish(new ShipmentReceivedIntegrationEvent(
                orderId,
                notification.WarehouseId.ToString(),
                "system" // Or track who completed it
            ), cancellationToken);
        }
    }
}
