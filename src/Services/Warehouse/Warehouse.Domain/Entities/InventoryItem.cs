using Logistics.Core;
using System.ComponentModel.DataAnnotations;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Domain.Entities;

public class InventoryItem : Entity<Guid>, IAggregateRoot
{
    public string Sku { get; private set; } = default!;
    public int QuantityOnHand { get; private set; }
    public int ReservedQty { get; private set; }
    public int AvailableQty => QuantityOnHand - ReservedQty;
    public DateTime? LastRestockedAt { get; private set; }
    public int Version { get; private set; }

    // EF Core
    private InventoryItem() { }

    public static InventoryItem Create(string sku, int initialQty)
    {
        if (initialQty < 0) throw new ArgumentOutOfRangeException(nameof(initialQty));

        var inventory = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Sku = sku,
            QuantityOnHand = initialQty,
            ReservedQty = 0,
            Version = 1,
            LastRestockedAt = DateTime.UtcNow
        };

        return inventory;
    }

    public void ReserveStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (AvailableQty < quantity) throw new InsufficientStockException(Sku, quantity, AvailableQty);

        ReservedQty += quantity;
        Version++;
    }

    public void Deduct(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (QuantityOnHand < quantity) throw new InsufficientStockException(Sku, quantity, QuantityOnHand);

        QuantityOnHand -= quantity;
        Version++;
    }

    public void Restock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));

        QuantityOnHand += quantity;
        LastRestockedAt = DateTime.UtcNow;
        Version++;
    }
}
