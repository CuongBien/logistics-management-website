namespace BuildingBlocks.Messaging.Events;

public record OrderCreatedIntegrationEvent(Guid OrderId) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
