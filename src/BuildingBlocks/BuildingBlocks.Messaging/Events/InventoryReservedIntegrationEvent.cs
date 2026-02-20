namespace BuildingBlocks.Messaging.Events;

public record InventoryReservedIntegrationEvent(Guid OrderId) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
