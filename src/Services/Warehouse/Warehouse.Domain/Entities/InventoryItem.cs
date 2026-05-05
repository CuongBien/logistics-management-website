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
    public uint Version { get; private set; }

    public static InventoryItem Create(string sku, int initialQty)
    {
        if (initialQty < 0) throw new ArgumentOutOfRangeException(nameof(initialQty));

        var inventory = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Sku = sku,
            QuantityOnHand = initialQty,
            Version = 1,
            LastRestockedAt = DateTime.UtcNow
        };

        return inventory;
    }

    public void Deduct(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (AvailableQty < quantity) throw new InsufficientStockException(Sku, quantity, AvailableQty);

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

    public void ReserveStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (AvailableQty < quantity) throw new InsufficientStockException(Sku, quantity, AvailableQty);

        ReservedQty += quantity;
        Version++;
    }
}
