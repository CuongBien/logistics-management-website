using BuildingBlocks.Messaging.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OMS.Application.Common.Interfaces;
using OMS.Domain.Entities;

namespace OMS.Application.Features.Orders.Consumers;

public class InventoryReservationFailedConsumer : IConsumer<InventoryReservationFailedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<InventoryReservationFailedConsumer> _logger;

    public InventoryReservationFailedConsumer(IApplicationDbContext context, ILogger<InventoryReservationFailedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<InventoryReservationFailedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Processing InventoryReservationFailedIntegrationEvent for Order: {OrderId}. Reason: {Reason}", message.OrderId, message.Reason);

        var order = await _context.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == message.OrderId);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found.", message.OrderId);
            return;
        }

        // Domain Logic: Cancel Order
        var result = order.Cancel();

        if (result.IsFailure)
        {
             _logger.LogWarning("Failed to cancel Order {OrderId}. Error: {Error}", message.OrderId, result.Error);
             return;
        }

        await _context.SaveChangesAsync(context.CancellationToken);
        
        _logger.LogInformation("Order {OrderId} cancelled due to inventory failure.", message.OrderId);
    }
}
