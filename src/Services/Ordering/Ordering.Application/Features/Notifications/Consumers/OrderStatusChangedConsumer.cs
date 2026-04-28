using EventBus.Messages.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Enums;

namespace Ordering.Application.Features.Notifications.Consumers;

public class OrderStatusChangedConsumer : 
    IConsumer<OrderCreatedIntegrationEvent>,
    IConsumer<ShipmentPickedUpIntegrationEvent>,
    IConsumer<ShipmentReceivedIntegrationEvent>,
    IConsumer<RouteDispatchedIntegrationEvent>,
    IConsumer<DeliveryCompletedIntegrationEvent>,
    IConsumer<DeliveryFailedIntegrationEvent>,
    IConsumer<ShipmentSortedIntegrationEvent>
{
    private readonly INotificationService _notificationService;
    private readonly IApplicationDbContext _context;
    private readonly ILogger<OrderStatusChangedConsumer> _logger;

    public OrderStatusChangedConsumer(
        INotificationService notificationService, 
        IApplicationDbContext context,
        ILogger<OrderStatusChangedConsumer> logger)
    {
        _notificationService = notificationService;
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var consignorId = context.Message.ConsignorId;
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "Created",
            $"Đơn hàng mới đã được khởi tạo thành công. Mã vận đơn: {context.Message.WaybillCode}",
            context.CancellationToken);
    }

    public async Task Consume(ConsumeContext<ShipmentPickedUpIntegrationEvent> context)
    {
        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "PickedUp",
            $"Kiện hàng đã được shipper {context.Message.DriverId} lấy thành công.",
            context.CancellationToken);
    }

    public async Task Consume(ConsumeContext<ShipmentReceivedIntegrationEvent> context)
    {
        await SyncOrderReceivedStatusAsync(
            context.Message.OrderId,
            context.Message.WarehouseId,
            context.CancellationToken);

        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "InWarehouse",
            $"Kiện hàng đã tới kho {context.Message.WarehouseId}.",
            context.CancellationToken);
    }

    public async Task Consume(ConsumeContext<RouteDispatchedIntegrationEvent> context)
    {
        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "Dispatched",
            $"Kiện hàng đang được giao bởi tài xế {context.Message.DriverId}.",
            context.CancellationToken);
    }

    public async Task Consume(ConsumeContext<ShipmentSortedIntegrationEvent> context)
    {
        await SyncOrderSortedStatusAsync(
            context.Message.OrderId,
            context.Message.DestinationWarehouseId,
            context.CancellationToken);

        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "InTransit",
            $"Kiện hàng đã được dỡ khỏi kho và chuyển trạng thái Đang Luân Chuyển.",
            context.CancellationToken);
    }

    public async Task Consume(ConsumeContext<DeliveryCompletedIntegrationEvent> context)
    {
        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "Delivered",
            "Giao hàng thành công ✅",
            context.CancellationToken);
    }

    public async Task Consume(ConsumeContext<DeliveryFailedIntegrationEvent> context)
    {
        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "DeliveryFailed",
            $"Giao thất bại (Lần {context.Message.AttemptNumber}): {context.Message.Reason}",
            context.CancellationToken);
    }

    private async Task<string> GetConsignorIdAsync(Guid orderId, CancellationToken cancellationToken)
    {
        var orderState = await _context.OrderStates
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrderId == orderId, cancellationToken);

        if (orderState != null && !string.IsNullOrEmpty(orderState.ConsignorId))
            return orderState.ConsignorId;

        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);
            
        return order?.ConsignorId ?? string.Empty;
    }

    private async Task SyncOrderReceivedStatusAsync(Guid orderId, string warehouseId, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order == null)
        {
            _logger.LogWarning("Cannot sync ShipmentReceived: Order {OrderId} not found", orderId);
            return;
        }

        if (order.Status == OrderStatus.InWarehouse || order.Status == OrderStatus.AwaitingDispatch)
        {
            _logger.LogInformation("Skip ShipmentReceived sync for Order {OrderId} because status is {Status}", orderId, order.Status);
            return;
        }

        if (order.Status != OrderStatus.PickedUp)
        {
            _logger.LogWarning("Cannot sync ShipmentReceived for Order {OrderId}. Expected PickedUp but got {Status}", orderId, order.Status);
            return;
        }

        var result = order.MarkInWarehouse(warehouseId, "integration-event");
        if (result.IsFailure)
        {
            _logger.LogWarning("ShipmentReceived sync failed for Order {OrderId}. Error: {ErrorCode} - {ErrorMessage}",
                orderId, result.Error.Code, result.Error.Message);
            return;
        }

        // Prevent event-loop: this sync is triggered by an integration event,
        // so we should not emit OrderReceivedInWarehouseDomainEvent again.
        order.ClearDomainEvents();
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("ShipmentReceived sync applied for Order {OrderId}", orderId);
    }

    private async Task SyncOrderSortedStatusAsync(Guid orderId, string destinationWarehouseId, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order == null)
        {
            _logger.LogWarning("Cannot sync ShipmentSorted: Order {OrderId} not found", orderId);
            return;
        }

        if (order.Status == OrderStatus.AwaitingDispatch || order.Status == OrderStatus.Dispatched)
        {
            _logger.LogInformation("Skip ShipmentSorted sync for Order {OrderId} because status is {Status}", orderId, order.Status);
            return;
        }

        if (order.Status != OrderStatus.InWarehouse)
        {
            _logger.LogWarning("Cannot sync ShipmentSorted for Order {OrderId}. Expected InWarehouse but got {Status}", orderId, order.Status);
            return;
        }

        var result = order.MarkSorted(destinationWarehouseId);
        if (result.IsFailure)
        {
            _logger.LogWarning("ShipmentSorted sync failed for Order {OrderId}. Error: {ErrorCode} - {ErrorMessage}",
                orderId, result.Error.Code, result.Error.Message);
            return;
        }

        // Prevent event-loop: this sync is triggered by an integration event,
        // so we should not emit OrderSortedDomainEvent again.
        order.ClearDomainEvents();
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("ShipmentSorted sync applied for Order {OrderId}", orderId);
    }
}
