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
    IConsumer<ShipmentSortedIntegrationEvent>,
    IConsumer<InboundDiscrepancyDetectedIntegrationEvent>
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
        var isStatusSynchronized = await SyncOrderReceivedStatusAsync(
            context.Message.OrderId,
            context.Message.WarehouseId,
            context.CancellationToken);
        if (!isStatusSynchronized) return;

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
        var isStatusSynchronized = await SyncOrderSortedStatusAsync(
            context.Message.OrderId,
            context.Message.DestinationWarehouseId,
            context.CancellationToken);
        if (!isStatusSynchronized) return;

        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "AwaitingDispatch",
            $"Kiện hàng đã được phân loại và chuyển trạng thái Chờ Điều Phối.",
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

    public async Task Consume(ConsumeContext<InboundDiscrepancyDetectedIntegrationEvent> context)
    {
        var isStatusSynchronized = await SyncOrderAwaitingResolutionStatusAsync(
            context.Message.OrderId,
            context.Message.WarehouseId,
            context.CancellationToken);
        if (!isStatusSynchronized) return;

        var consignorId = await GetConsignorIdAsync(context.Message.OrderId, context.CancellationToken);
        if (string.IsNullOrEmpty(consignorId)) return;

        var details = string.Join(", ", context.Message.Lines.Select(l => 
            $"{l.SkuCode} (Dự kiến: {l.ExpectedQty}, Thực tế: {l.ReceivedQty})"));

        await _notificationService.SendOrderStatusUpdatedAsync(
            consignorId, context.Message.OrderId,
            "AwaitingResolution",
            $"Phát hiện sai lệch khi nhập kho tại {context.Message.WarehouseId}. Vui lòng xử lý ngoại lệ. Chi tiết: {details}",
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

    private async Task<bool> SyncOrderReceivedStatusAsync(Guid orderId, string warehouseId, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order == null)
        {
            _logger.LogWarning("Cannot sync ShipmentReceived: Order {OrderId} not found", orderId);
            return false;
        }

        // Idempotency: skip if already InWarehouse at the same warehouse
        if (order.Status == OrderStatus.InWarehouse)
        {
            _logger.LogInformation("Skip ShipmentReceived sync for Order {OrderId} because status is already InWarehouse", orderId);
            return false;
        }

        // Allow multi-hop: PickedUp → InWarehouse (first arrival) or AwaitingDispatch → InWarehouse (destination arrival)
        if (order.Status != OrderStatus.PickedUp && order.Status != OrderStatus.AwaitingDispatch)
        {
            _logger.LogWarning("Cannot sync ShipmentReceived for Order {OrderId}. Expected PickedUp or AwaitingDispatch but got {Status}", orderId, order.Status);
            return false;
        }

        var result = order.MarkInWarehouse(warehouseId, "integration-event");
        if (result.IsFailure)
        {
            _logger.LogWarning("ShipmentReceived sync failed for Order {OrderId}. Error: {ErrorCode} - {ErrorMessage}",
                orderId, result.Error.Code, result.Error.Message);
            return false;
        }

        // Prevent event-loop: this sync is triggered by an integration event,
        // so we should not emit OrderReceivedInWarehouseDomainEvent again.
        order.ClearDomainEvents();
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("ShipmentReceived sync applied for Order {OrderId}", orderId);
        return true;
    }

    private async Task<bool> SyncOrderSortedStatusAsync(Guid orderId, string destinationWarehouseId, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order == null)
        {
            _logger.LogWarning("Cannot sync ShipmentSorted: Order {OrderId} not found", orderId);
            return false;
        }

        if (order.Status == OrderStatus.AwaitingDispatch || order.Status == OrderStatus.Dispatched)
        {
            _logger.LogInformation("Skip ShipmentSorted sync for Order {OrderId} because status is {Status}", orderId, order.Status);
            return false;
        }

        if (order.Status != OrderStatus.InWarehouse)
        {
            _logger.LogWarning("Cannot sync ShipmentSorted for Order {OrderId}. Expected InWarehouse but got {Status}", orderId, order.Status);
            return false;
        }

        var result = order.MarkSorted(destinationWarehouseId);
        if (result.IsFailure)
        {
            _logger.LogWarning("ShipmentSorted sync failed for Order {OrderId}. Error: {ErrorCode} - {ErrorMessage}",
                orderId, result.Error.Code, result.Error.Message);
            return false;
        }

        // Prevent event-loop: this sync is triggered by an integration event,
        // so we should not emit OrderSortedDomainEvent again.
        order.ClearDomainEvents();
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("ShipmentSorted sync applied for Order {OrderId}", orderId);
        return true;
    }

    private async Task<bool> SyncOrderAwaitingResolutionStatusAsync(Guid orderId, string warehouseId, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .FirstOrDefaultAsync(x => x.Id == orderId, cancellationToken);

        if (order == null)
        {
            _logger.LogWarning("Cannot sync InboundDiscrepancyDetected: Order {OrderId} not found", orderId);
            return false;
        }

        if (order.Status == OrderStatus.AwaitingResolution)
        {
            _logger.LogInformation("Skip InboundDiscrepancyDetected sync for Order {OrderId} because status is already AwaitingResolution", orderId);
            return false;
        }

        var result = order.MarkAwaitingResolution(warehouseId);
        if (result.IsFailure)
        {
            _logger.LogWarning("InboundDiscrepancyDetected sync failed for Order {OrderId}. Error: {ErrorCode} - {ErrorMessage}",
                orderId, result.Error.Code, result.Error.Message);
            return false;
        }

        order.ClearDomainEvents();
        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("InboundDiscrepancyDetected sync applied for Order {OrderId}", orderId);
        return true;
    }
}
