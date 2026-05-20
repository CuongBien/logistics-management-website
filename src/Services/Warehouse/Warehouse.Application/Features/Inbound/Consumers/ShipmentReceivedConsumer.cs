using EventBus.Messages.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inbound.Consumers;

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
        var destinationWarehouseId = Guid.TryParse(message.WarehouseId, out var parsedId) ? parsedId : Guid.Empty;

        _logger.LogInformation("Consuming ShipmentReceived for Order {OrderId} at Warehouse {WH}", message.OrderId, message.WarehouseId);

        // 1. Find the InboundReceipt to get the SourceShipmentNo
        var receipt = await _context.InboundReceipts
            .FirstOrDefaultAsync(x => x.OrderId == message.OrderId && x.WarehouseId == destinationWarehouseId, context.CancellationToken);

        if (receipt == null || string.IsNullOrWhiteSpace(receipt.SourceShipmentNo))
        {
            _logger.LogWarning("Cannot find InboundReceipt or SourceShipmentNo for Order {OrderId} at Warehouse {WH}", message.OrderId, message.WarehouseId);
            return;
        }

        // 2. Find the Shipment by ShipmentNo
        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(x => x.ShipmentNo == receipt.SourceShipmentNo && (x.Status == ShipmentStatus.Shipped || x.Status == ShipmentStatus.Delivered), context.CancellationToken);

        if (shipment == null)
        {
            _logger.LogWarning("No dispatched Shipment found with ShipmentNo {ShipmentNo}", receipt.SourceShipmentNo);
            return;
        }

        // 3. Mark as Delivered
        shipment.Deliver();
        
        await _context.SaveChangesAsync(context.CancellationToken);

        _logger.LogInformation("Shipment {ShipmentNo} marked as Delivered for Order {OrderId}", receipt.SourceShipmentNo, message.OrderId);
    }
}
