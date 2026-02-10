using BuildingBlocks.Domain;
using OMS.Domain.ValueObjects;

namespace OMS.Domain.Entities;

public class OrderItem : Entity<Guid>
{
    public Guid OrderId { get; private set; }
    public string ProductId { get; private set; }
    public int Quantity { get; private set; }
    public Money UnitPrice { get; private set; }

    internal OrderItem(Guid orderId, string productId, int quantity, Money unitPrice)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        ProductId = productId;
        Quantity = quantity;
        UnitPrice = unitPrice;
    }

    // Default constructor for EF Core
    private OrderItem() { }
}
