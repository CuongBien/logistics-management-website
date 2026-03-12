using MassTransit;

namespace OMS.Application.Sagas.OrderFulfillment;

public class OrderState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; }
    public string CurrentState { get; set; } = null!;
    
    // Order Metadata
    public Guid OrderId { get; set; }
    public string ConsignorId { get; set; } = string.Empty;
    public string WaybillCode { get; set; } = string.Empty;
    public decimal CodAmount { get; set; }
    
    // Tracking — populated by human actions
    public string? PickupDriverId { get; set; }
    public string? WarehouseId { get; set; }
    public string? DestinationHubId { get; set; }
    public string? DeliveryDriverId { get; set; }
    public string? RouteId { get; set; }
    public string? ProofOfDeliveryUrl { get; set; }
    public string? FailureReason { get; set; }
    public int DeliveryAttempts { get; set; }
    
    public int Version { get; set; }
}
