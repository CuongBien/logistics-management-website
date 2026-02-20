using BuildingBlocks.Messaging.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OMS.Application.Common.Interfaces;
using OMS.Domain.Entities;

namespace OMS.Application.Features.Orders.Consumers;

public class InventoryReservedConsumer : IConsumer<InventoryReservedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<InventoryReservedConsumer> _logger;

    public InventoryReservedConsumer(IApplicationDbContext context, ILogger<InventoryReservedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<InventoryReservedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Processing InventoryReservedIntegrationEvent for Order: {OrderId}", message.OrderId);

        var order = await _context.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == message.OrderId);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found.", message.OrderId);
            return;
        }

        // Domain Logic: Confirm Order
        var result = order.Confirm();

        if (result.IsFailure)
        {
             _logger.LogWarning("Failed to confirm Order {OrderId}. Error: {Error}", message.OrderId, result.Error);
             // Maybe publish OrderConfirmationFailed? Or just log.
             return;
        }

        await _context.SaveChangesAsync(context.CancellationToken);
        
        _logger.LogInformation("Order {OrderId} confirmed.", message.OrderId);
    }
}
