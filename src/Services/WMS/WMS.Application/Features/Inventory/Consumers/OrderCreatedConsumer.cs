using BuildingBlocks.Messaging.Events;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WMS.Application.Common.Interfaces;
using WMS.Domain.Exceptions;

namespace WMS.Application.Features.Inventory.Consumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(IApplicationDbContext context, ILogger<OrderCreatedConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Processing OrderCreatedIntegrationEvent for Order: {OrderId}", message.OrderId);

        if (message.Items == null || !message.Items.Any())
        {
            _logger.LogWarning("Order {OrderId} has no items.", message.OrderId);
            return;
        }

        var requestedSkus = message.Items.Select(x => x.ProductId).ToList();
        
        // Load Inventory Items
        var inventoryItems = await _context.InventoryItems
            .Where(x => requestedSkus.Contains(x.Sku))
            .ToListAsync(context.CancellationToken);

        // check if all items exist
        var missingSkus = requestedSkus.Except(inventoryItems.Select(x => x.Sku)).ToList();
        if (missingSkus.Any())
        {
            _logger.LogWarning("Order {OrderId} failed reservation. Missing SKUs: {Skus}", message.OrderId, string.Join(", ", missingSkus));
            
            await context.Publish(new InventoryReservationFailedIntegrationEvent(message.OrderId, $"Missing SKUs: {string.Join(", ", missingSkus)}"));
            return;
        }

        try
        {
            foreach (var itemDto in message.Items)
            {
                var inventoryItem = inventoryItems.First(x => x.Sku == itemDto.ProductId);
                inventoryItem.ReserveStock(itemDto.Quantity);
            }

            await _context.SaveChangesAsync(context.CancellationToken);
            
            _logger.LogInformation("Stock reserved for Order {OrderId}", message.OrderId);
            await context.Publish(new InventoryReservedIntegrationEvent(message.OrderId));
        }
        catch (InsufficientStockException ex)
        {
            _logger.LogWarning(ex, "Order {OrderId} failed reservation due to insufficient stock.", message.OrderId);
            await context.Publish(new InventoryReservationFailedIntegrationEvent(message.OrderId, ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Order {OrderId} failed reservation due to unexpected error.", message.OrderId);
            // Re-throw to let MassTransit retry? 
            // Or publish failure? 
            // If it's a transient DB error, retry is better.
            // If it's logic error, publish failure.
            // For now let's republish failure if it's not retryable, but keeping it simple:
            // Throwing allows retry. Publishing failure stops flow.
            // If we publish failure here, we should ensure we didn't partially commit (using Transaction).
            throw; 
        }
    }
}
