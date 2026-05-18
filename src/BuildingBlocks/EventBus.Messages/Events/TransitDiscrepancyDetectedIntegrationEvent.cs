using System;

namespace EventBus.Messages.Events;

public record TransitDiscrepancyDetectedIntegrationEvent(
    Guid DiscrepancyId,
    Guid OrderId,
    Guid ShipmentId,
    Guid WarehouseId,
    string Sku,
    int ShippedQty,
    int ReceivedQty,
    int DiscrepancyQty,
    string Carrier,
    string OperatorId,
    string? Notes = null
) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
