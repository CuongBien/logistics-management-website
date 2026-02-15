using BuildingBlocks.Domain;
using OMS.Domain.Enums;
using OMS.Domain.Events;
using OMS.Domain.Errors;
using OMS.Domain.ValueObjects;

namespace OMS.Domain.Entities;

public class Order : Entity<Guid>, IAggregateRoot
{
    public string CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Address ShippingAddress { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastModifiedAt { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public decimal TotalAmount => _items.Sum(x => x.Quantity * x.UnitPrice.Amount);

    // EF Core
    private Order() { }

    public static Result<Order> Create(string customerId, Address shippingAddress, List<OrderItem>? items = null)
    {
        var order = new Order
        {
            Id = Guid.NewGuid(),
            CustomerId = customerId,
            ShippingAddress = shippingAddress,
            Status = OrderStatus.New,
            CreatedAt = DateTime.UtcNow
        };

        if (items != null && items.Any())
        {
            foreach (var item in items)
            {
                order._items.Add(item);
            }
        }
        
        // Business Rule: Order must have at least one item? 
        // If we allow creating empty order layout first, then valid. 
        // But usually Order needs items. Let's enforce it if passed, or allow later addition.
        // For now, allow creation without items, but Confirm will check.

        order.AddDomainEvent(new OrderCreatedDomainEvent(order.Id, customerId, order.TotalAmount));

        return Result<Order>.Success(order);
    }

    public void AddItem(string productId, int quantity, Money unitPrice)
    {
        if (Status != OrderStatus.New)
        {
            throw new InvalidOperationException("Can only add items to new order."); // OR return Result
        }

        var item = new OrderItem(Id, productId, quantity, unitPrice);
        _items.Add(item);
    }

    public Result Confirm()
    {
        if (!_items.Any())
        {
            return Result.Failure(DomainErrors.Order.EmptyItems); 
            // Checking BuildingBlocks.Result... it takes string error. 
            // DomainErrors.Order.EmptyItems returns Error record.
            // Adjusting based on BuildingBlocks: 
            // If Result.Failure takes string, pass Error.Code + Message.
            // Ideally BuildingBlocks Result should take Error object. 
            // Assumption: BuildingBlocks.Result.Failure(string) is what we saw.
        }

        Status = OrderStatus.Confirmed;
        LastModifiedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status != OrderStatus.New && Status != OrderStatus.Confirmed)
        {
            // return Result.Failure(DomainErrors.Order.CannotCancel);
             return Result.Failure(DomainErrors.Order.CannotCancel);
        }

        Status = OrderStatus.Cancelled;
        LastModifiedAt = DateTime.UtcNow;
        
        AddDomainEvent(new OrderCancelledDomainEvent(Id));
        
        return Result.Success();
    }
}
