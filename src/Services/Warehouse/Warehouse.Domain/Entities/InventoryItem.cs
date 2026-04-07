using Logistics.Core;
using System.ComponentModel.DataAnnotations;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Domain.Entities;

public class InventoryItem : Entity<Guid>, IAggregateRoot
{
    public Guid Sku { get; private set; }
    public int Quantity { get; private set; }
    public uint Version { get; private set; }

    public static InventoryItem Create(Guid sku, int initialQty)
    {
        if (initialQty < 0) throw new ArgumentOutOfRangeException(nameof(initialQty));

        var inventory = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Sku = sku,
            Quantity = initialQty,
            Version = 1
        };

        return inventory;
    }

    public void Deduct(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (Quantity < quantity) throw new InsufficientStockException(Sku.ToString(), quantity, Quantity);

        Quantity -= quantity;
        Version++;
    }

    public void Restock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));

        Quantity += quantity;
        Version++;
    }
}
