namespace EventBus.Messages.Events;

public record ShipmentSortedIntegrationEvent(
    Guid OrderId,
    string DestinationHubId,
    DateTime SortedAt) : IntegrationEvent(Guid.NewGuid(), SortedAt);