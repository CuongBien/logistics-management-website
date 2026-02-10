using BuildingBlocks.Domain;
using OMS.Domain.Enums;
using OMS.Domain.Events;
using OMS.Domain.ValueObjects;

namespace OMS.Domain.Entities;

public class Order : Entity<Guid>
{
    public string CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Address ShippingAddress { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastModifiedAt { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public decimal TotalAmount => _items.Sum(x => x.Quantity * x.UnitPrice.Amount);

    public static Order Create(string customerId, Address shippingAddress)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            ShippingAddress = shippingAddress,
            Status = OrderStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        order.AddDomainEvent(new OrderCreatedEvent(order.Id, customerId));

        return order;
    }

    public void AddItem(string productId, int quantity, Money unitPrice)
    {
        // Business rule: Can only add items when Draft
        if (Status != OrderStatus.Draft)
        {
            throw new InvalidOperationException("Can only add items to draft order.");
        }

        var item = new OrderItem(Id, productId, quantity, unitPrice);
        _items.Add(item);
    }

    public void Confirm()
    {
        Status = OrderStatus.Submitted;
        LastModifiedAt = DateTime.UtcNow;
    }

    private Order() { } // For EF Core
}
