using BuildingBlocks.Domain;

namespace OMS.Domain.Events;

public record OrderItemDomainDto(string ProductId, int Quantity, decimal UnitPrice, string Currency);

public record OrderCreatedDomainEvent(Guid OrderId, string CustomerId, decimal TotalAmount, IEnumerable<OrderItemDomainDto> Items) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}
