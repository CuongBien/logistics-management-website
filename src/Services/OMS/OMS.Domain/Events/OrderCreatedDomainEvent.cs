using BuildingBlocks.Domain;

namespace OMS.Domain.Events;

// --- Order Lifecycle Domain Events ---

public record OrderCreatedDomainEvent(
    Guid OrderId, 
    string ConsignorId, 
    string WaybillCode, 
    decimal CodAmount,
    decimal ShippingFee) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderPickedUpDomainEvent(Guid OrderId, string DriverId) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderReceivedInWarehouseDomainEvent(Guid OrderId, string WarehouseId, string ReceivedBy) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderSortedDomainEvent(Guid OrderId, string DestinationHubId) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderDispatchedDomainEvent(Guid OrderId, string DriverId, string RouteId) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderDeliveredDomainEvent(Guid OrderId, string ProofOfDeliveryUrl) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderDeliveryFailedDomainEvent(Guid OrderId, string Reason, int AttemptNumber) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record OrderCancelledDomainEvent(Guid OrderId) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
