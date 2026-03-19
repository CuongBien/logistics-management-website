using Logistics.Core;
using System.ComponentModel.DataAnnotations;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Domain.Entities;

public class InventoryItem : Entity<Guid>, IAggregateRoot
{
    public string Sku { get; private set; } = default!;
    public int QuantityOnHand { get; private set; }
    public int ReservedQty { get; private set; }
    
    [Timestamp]
    public uint RowVersion { get; private set; }

    public int AvailableQty => QuantityOnHand - ReservedQty;

    public DateTime? LastRestockedAt { get; private set; }

    public static InventoryItem Create(string sku, int initialQty)
    {
        ArgumentException.ThrowIfNullOrEmpty(sku);
        if (initialQty < 0) throw new ArgumentOutOfRangeException(nameof(initialQty));

        var inventory = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Sku = sku,
            QuantityOnHand = initialQty,
            ReservedQty = 0,
            LastRestockedAt = DateTime.UtcNow
        };

        // Add domain event if needed
        // inventory.AddDomainEvent(new InventoryCreatedEvent(inventory.Id));
        
        return inventory;
    }

    public void ReserveStock(int quantity)
    {
        if (quantity <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Reservation quantity must be greater than zero.");
        }

        if (AvailableQty < quantity)
        {
            throw new InsufficientStockException(Sku, quantity, AvailableQty);
        }

        ReservedQty += quantity;
    }

    public void ReleaseStock(int quantity)
    {
        if (quantity <= 0)
        {
             throw new ArgumentOutOfRangeException(nameof(quantity), "Release quantity must be greater than zero.");
        }

        if (ReservedQty < quantity)
        {
             ReservedQty = 0;
        }
        else
        {
            ReservedQty -= quantity;
        }
    }

    public void ConfirmStockDeduction(int quantity)
    {
         if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
         
         if (ReservedQty < quantity)
         {
             // Log warning or handle?
             // For now just deduct what is possible from reserved, but full from OnHand?
             // Or assuming Reserve was done before.
         }
         
         ReservedQty -= quantity;
         QuantityOnHand -= quantity;
         
         if (ReservedQty < 0) ReservedQty = 0;
         if (QuantityOnHand < 0) QuantityOnHand = 0; 
    }

    public void Restock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));

        QuantityOnHand += quantity;
        LastRestockedAt = DateTime.UtcNow;
    }
}
