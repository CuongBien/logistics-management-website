using EventBus.Messages.Events;
using MassTransit;
using MediatR;
using Ordering.Domain.Events;

namespace Ordering.Application.Features.Orders.EventHandlers;

public class OrderExceptionResolvedEventHandler : INotificationHandler<OrderExceptionResolvedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;

    public OrderExceptionResolvedEventHandler(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public async Task Handle(OrderExceptionResolvedDomainEvent notification, CancellationToken cancellationToken)
    {
        await _publishEndpoint.Publish(new OrderExceptionResolvedIntegrationEvent(
            notification.OrderId,
            notification.Strategy
        ), cancellationToken);
    }
}
