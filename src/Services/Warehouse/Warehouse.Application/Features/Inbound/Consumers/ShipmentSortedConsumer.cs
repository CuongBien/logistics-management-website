using EventBus.Messages.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inbound.Consumers;

public sealed class ShipmentSortedConsumer : IConsumer<ShipmentSortedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ShipmentSortedConsumer> _logger;

    public ShipmentSortedConsumer(IApplicationDbContext context, ILogger<ShipmentSortedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ShipmentSortedIntegrationEvent> context)
    {
        var message = context.Message;

        if (string.IsNullOrWhiteSpace(message.TenantId) || string.IsNullOrWhiteSpace(message.CustomerId))
        {
            _logger.LogWarning(
                "Skip inbound pre-create for Order {OrderId} because tenant/customer context is missing.",
                message.OrderId);
            return;
        }

        var existed = await _context.InboundReceipts
            .FirstOrDefaultAsync(x => x.OrderId == message.OrderId, context.CancellationToken);

        if (existed is not null)
        {
            _logger.LogInformation(
                "Inbound receipt already exists for Order {OrderId}. Skip duplicate pre-create.",
                message.OrderId);
            return;
        }

        var sourceShipmentNo = message.SourceShipmentNo;
        if (string.IsNullOrWhiteSpace(sourceShipmentNo))
        {
            sourceShipmentNo = $"ASN-{message.OrderId:N}";
        }

        var destinationWarehouseId = Guid.TryParse(message.DestinationWarehouseId, out var parsedId) ? parsedId : Guid.Empty;

        var receipt = new InboundReceipt(
            message.OrderId,
            message.TenantId,
            message.CustomerId,
            destinationWarehouseId,
            sourceShipmentNo);

        _context.InboundReceipts.Add(receipt);
        await _context.SaveChangesAsync(context.CancellationToken);

        _logger.LogInformation(
            "Pre-created inbound receipt {ReceiptId} for Order {OrderId} with SourceShipmentNo {SourceShipmentNo}.",
            receipt.Id,
            message.OrderId,
            sourceShipmentNo);
    }
}
