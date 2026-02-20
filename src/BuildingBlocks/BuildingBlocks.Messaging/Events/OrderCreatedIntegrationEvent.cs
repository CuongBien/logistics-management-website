namespace BuildingBlocks.Messaging.Events;

public record OrderItemDto(string ProductId, int Quantity);

public record OrderCreatedIntegrationEvent(Guid OrderId, IEnumerable<OrderItemDto> Items) 
    : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
