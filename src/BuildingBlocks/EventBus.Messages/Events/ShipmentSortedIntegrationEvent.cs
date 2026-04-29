namespace EventBus.Messages.Events;

public record ShipmentSortedIntegrationEvent(
    Guid OrderId,
    string DestinationWarehouseId,
    DateTime SortedAt) : IntegrationEvent(Guid.NewGuid(), SortedAt);