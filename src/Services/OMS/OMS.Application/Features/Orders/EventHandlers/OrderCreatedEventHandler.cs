using BuildingBlocks.Messaging.Events;
using MediatR;
using MassTransit;
using Microsoft.Extensions.Logging;
using OMS.Domain.Events;

namespace OMS.Application.Features.Orders.EventHandlers;

public class OrderCreatedEventHandler : INotificationHandler<OrderCreatedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderCreatedEventHandler> _logger;

    public OrderCreatedEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderCreatedEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderCreatedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Domain Event: Order {OrderId} created. Publishing Integration Event...", notification.OrderId);

        var integrationEvent = new OrderCreatedIntegrationEvent(notification.OrderId);

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);
    }
}
