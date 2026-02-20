namespace BuildingBlocks.Messaging.Events;

public record InventoryReservationFailedIntegrationEvent(Guid OrderId, string Reason) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
