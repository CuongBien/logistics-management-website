using EventBus.Messages.Events;
using MediatR;
using MassTransit;
using Microsoft.Extensions.Logging;
using Ordering.Domain.Events;

namespace Ordering.Application.Features.Orders.EventHandlers;

/// <summary>
/// Bridges Domain Events → Integration Events for each human-triggered status change.
/// Domain Events are raised by Order entity methods, dispatched by SaveChanges.
/// </summary>

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
        _logger.LogInformation("Order {OrderId} created with Waybill {WaybillCode}. Publishing Integration Event...", 
            notification.OrderId, notification.WaybillCode);

        await _publishEndpoint.Publish(new OrderCreatedIntegrationEvent(
            notification.OrderId, notification.WaybillCode, notification.ConsignorId, notification.CodAmount), cancellationToken);
    }
}

public class OrderPickedUpEventHandler : INotificationHandler<OrderPickedUpDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderPickedUpEventHandler> _logger;

    public OrderPickedUpEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderPickedUpEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderPickedUpDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("👤 Shipper {DriverId} picked up Order {OrderId}", notification.DriverId, notification.OrderId);
        await _publishEndpoint.Publish(new ShipmentPickedUpIntegrationEvent(notification.OrderId, notification.DriverId), cancellationToken);
    }
}

public class OrderReceivedEventHandler : INotificationHandler<OrderReceivedInWarehouseDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderReceivedEventHandler> _logger;

    public OrderReceivedEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderReceivedEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderReceivedInWarehouseDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("👤 Warehouse {WarehouseId} received Order {OrderId}", notification.WarehouseId, notification.OrderId);
        await _publishEndpoint.Publish(new ShipmentReceivedIntegrationEvent(notification.OrderId, notification.WarehouseId, notification.ReceivedBy), cancellationToken);
    }
}

public class OrderSortedEventHandler : INotificationHandler<OrderSortedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderSortedEventHandler> _logger;

    public OrderSortedEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderSortedEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderSortedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("👤 Order {OrderId} sorted to Hub {HubId}", notification.OrderId, notification.DestinationHubId);
        await _publishEndpoint.Publish(new ShipmentSortedIntegrationEvent(notification.OrderId, notification.DestinationHubId, DateTime.UtcNow), cancellationToken);
    }
}

public class OrderDispatchedEventHandler : INotificationHandler<OrderDispatchedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderDispatchedEventHandler> _logger;

    public OrderDispatchedEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderDispatchedEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderDispatchedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("👤 Order {OrderId} dispatched to Driver {DriverId}", notification.OrderId, notification.DriverId);
        await _publishEndpoint.Publish(new RouteDispatchedIntegrationEvent(notification.OrderId, notification.DriverId, notification.RouteId), cancellationToken);
    }
}

public class OrderDeliveredEventHandler : INotificationHandler<OrderDeliveredDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderDeliveredEventHandler> _logger;

    public OrderDeliveredEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderDeliveredEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderDeliveredDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("👤 Order {OrderId} delivered. POD: {Pod}", notification.OrderId, notification.ProofOfDeliveryUrl);
        await _publishEndpoint.Publish(new DeliveryCompletedIntegrationEvent(notification.OrderId, notification.ProofOfDeliveryUrl), cancellationToken);
    }
}

public class OrderDeliveryFailedEventHandler : INotificationHandler<OrderDeliveryFailedDomainEvent>
{
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderDeliveryFailedEventHandler> _logger;

    public OrderDeliveryFailedEventHandler(IPublishEndpoint publishEndpoint, ILogger<OrderDeliveryFailedEventHandler> logger)
    {
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Handle(OrderDeliveryFailedDomainEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogWarning("👤 Order {OrderId} delivery failed (Attempt {Attempt}): {Reason}", 
            notification.OrderId, notification.AttemptNumber, notification.Reason);
        await _publishEndpoint.Publish(new DeliveryFailedIntegrationEvent(notification.OrderId, notification.Reason, notification.AttemptNumber), cancellationToken);
    }
}
