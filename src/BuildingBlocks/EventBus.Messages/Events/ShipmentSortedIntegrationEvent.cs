namespace EventBus.Messages.Events;

public record ShipmentSortedIntegrationEvent(
    Guid OrderId,
    string DestinationWarehouseId,
    DateTime SortedAt,
    string? TenantId = null,
    string? CustomerId = null,
    string? SourceShipmentNo = null) : IntegrationEvent(Guid.NewGuid(), SortedAt);