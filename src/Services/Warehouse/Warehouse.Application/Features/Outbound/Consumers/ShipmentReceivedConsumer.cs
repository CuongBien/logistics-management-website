using EventBus.Messages.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Consumers;

public sealed class ShipmentReceivedConsumer : IConsumer<ShipmentReceivedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ShipmentReceivedConsumer> _logger;

    public ShipmentReceivedConsumer(IApplicationDbContext context, ILogger<ShipmentReceivedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ShipmentReceivedIntegrationEvent> context)
    {
        var message = context.Message;

        var outboundOrder = await _context.OutboundOrders
            .FirstOrDefaultAsync(x => x.OrderId == message.OrderId, context.CancellationToken);

        if (outboundOrder == null)
        {
            _logger.LogInformation(
                "No OutboundOrder found for Order {OrderId}. Cannot update Shipment.",
                message.OrderId);
            return;
        }

        var destinationId = message.WarehouseId;

        // Find the Shipment created at SourceWarehouseId pointing to this DestinationId
        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(x => 
                x.WarehouseId == outboundOrder.WarehouseId && 
                x.DestinationId == destinationId && 
                x.Status == ShipmentStatus.Dispatched, context.CancellationToken);

        if (shipment == null)
        {
            _logger.LogInformation(
                "No dispatched Shipment found for Order {OrderId} from Source {SourceId} to Destination {DestinationId}. It may have already been delivered or not consolidated yet.",
                message.OrderId, outboundOrder.WarehouseId, destinationId);
            return;
        }

        shipment.Deliver();
        await _context.SaveChangesAsync(context.CancellationToken);

        _logger.LogInformation(
            "Shipment {ShipmentId} from Source {SourceId} to Destination {DestinationId} marked as Delivered.",
            shipment.Id, shipment.WarehouseId, destinationId);
    }
}
