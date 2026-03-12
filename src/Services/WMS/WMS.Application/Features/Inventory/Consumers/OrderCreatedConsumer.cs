using BuildingBlocks.Messaging.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace WMS.Application.Features.Inventory.Consumers;

/// <summary>
/// In the logistics flow, WMS no longer auto-reserves stock.
/// Instead, it just logs the incoming shipment notification.
/// Actual warehouse receiving is triggered by a human scan (via OMS API).
/// </summary>
public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(ILogger<OrderCreatedConsumer> logger)
    {
        _logger = logger;
    }

    public Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "WMS: Received notification — Order {OrderId} (Waybill: {WaybillCode}) created by Consignor {ConsignorId}. COD: {CodAmount}. Awaiting physical pickup & inbound scan.",
            message.OrderId, message.WaybillCode, message.ConsignorId, message.CodAmount);

        // In a full system, this could:
        // 1. Create a pending InboundTask for warehouse staff to expect this shipment
        // 2. Send a push notification to the assigned pickup driver
        // For now, we just log the notification. The actual inbound processing  
        // happens when a warehouse employee scans the parcel (via OMS API → MarkInWarehouse).

        return Task.CompletedTask;
    }
}
