using EventBus.Messages.Events;

namespace EventBus.Messages.Events;

public record ShipmentSortedIntegrationEvent(
    Guid OrderId,
    Guid DestinationHubId,
    DateTime SortedAt) : IntegrationEvent(Guid.NewGuid(), SortedAt);