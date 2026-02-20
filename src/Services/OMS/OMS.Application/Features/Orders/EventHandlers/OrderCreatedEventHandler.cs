using BuildingBlocks.Messaging.Events;
using MediatR;
using MassTransit;
using Microsoft.Extensions.Logging;
using OMS.Domain.Events;
using OMS.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace OMS.Application.Features.Orders.EventHandlers;

public class OrderCreatedEventHandler : INotificationHandler<OrderCreatedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderCreatedEventHandler> _logger;
    private readonly IApplicationDbContext _context;

    public OrderCreatedEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderCreatedEventHandler> logger, IApplicationDbContext context)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _context = context;
    }

    public async Task Handle(OrderCreatedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Domain Event: Order {OrderId} created. Publishing Integration Event...", notification.OrderId);

        // Map Domain DTOs to Integration DTOs
        var integrationItems = notification.Items.Select(x => new OrderItemDto(x.ProductId, x.Quantity));

        var integrationEvent = new OrderCreatedIntegrationEvent(notification.OrderId, integrationItems);

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);
    }
}
