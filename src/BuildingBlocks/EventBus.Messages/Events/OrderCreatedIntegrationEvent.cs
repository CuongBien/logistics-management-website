namespace EventBus.Messages.Events;

// --- Core Order Lifecycle Events ---

public record OrderCreatedIntegrationEvent(
    Guid OrderId, 
    string WaybillCode, 
    string ConsignorId, 
    decimal CodAmount) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);

// --- Human-triggered Shipment Events ---

public record ShipmentPickedUpIntegrationEvent(
    Guid OrderId, 
    string DriverId) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);

public record ShipmentReceivedIntegrationEvent(
    Guid OrderId, 
    string WarehouseId, 
    string ReceivedBy) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);

public record RouteDispatchedIntegrationEvent(
    Guid OrderId, 
    string DriverId, 
    string RouteId) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);

// --- Delivery Outcome Events ---

public record DeliveryCompletedIntegrationEvent(
    Guid OrderId, 
    string ProofOfDeliveryUrl) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);

public record DeliveryFailedIntegrationEvent(
    Guid OrderId, 
    string Reason, 
    int AttemptNumber) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
