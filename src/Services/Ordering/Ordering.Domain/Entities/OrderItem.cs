using Logistics.Core;

namespace Ordering.Domain.Entities;

public class OrderItem : Entity<Guid>
{
    public Guid OrderId { get; private set; }
    public Guid Sku { get; private set; }
    public int Quantity { get; private set; }
    public decimal Price { get; private set; }

    // Navigation
    public Order Order { get; private set; } = default!;

    // EF Core
    private OrderItem() { }

    public OrderItem(Guid sku, int quantity, decimal price)
    {
        Id = Guid.NewGuid();
        Sku = sku;
        Quantity = quantity;
        Price = price;
    }

    public void UpdateQuantity(int newQuantity)
    {
        if (newQuantity <= 0)
            throw new ArgumentException("Quantity must be positive");
        Quantity = newQuantity;
    }

    public void UpdatePrice(decimal newPrice)
    {
        if (newPrice < 0)
            throw new ArgumentException("Price cannot be negative");
        Price = newPrice;
    }
}