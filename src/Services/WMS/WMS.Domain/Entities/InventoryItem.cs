using System.ComponentModel.DataAnnotations;
using BuildingBlocks.Domain;
using WMS.Domain.Exceptions;

namespace WMS.Domain.Entities;

public class InventoryItem : Aggregate<Guid>
{
    public string Sku { get; private set; } = default!;
    public int QuantityOnHand { get; private set; }
    public int ReservedQty { get; private set; }

    [Timestamp]
    public byte[] RowVersion { get; private set; } = default!;

    public int AvailableQty => QuantityOnHand - ReservedQty;

    public InventoryItem()
    {
        // EF Core
    }

    public static InventoryItem Create(string sku, int initialQty)
    {
        ArgumentException.ThrowIfNullOrEmpty(sku);
        if (initialQty < 0) throw new ArgumentOutOfRangeException(nameof(initialQty));

        return new InventoryItem
        {
            Id = Guid.NewGuid(),
            Sku = sku,
            QuantityOnHand = initialQty,
            ReservedQty = 0
        };
    }

    public void AddStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        QuantityOnHand += quantity;
    }

    public void ReserveStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        
        if (AvailableQty < quantity)
        {
            throw new InsufficientStockException(Sku, quantity, AvailableQty);
        }

        ReservedQty += quantity;
    }

    public void AdjustStock(int newQuantity)
    {
         if (newQuantity < 0) throw new ArgumentOutOfRangeException(nameof(newQuantity));
         // Logic to handle adjustments, keeping logic simple for now
         // Usually we adjust QuantityOnHand, but if ReservedQty > NewQuantity, we might have an issue.
         // For now, let's assume raw adjustment is force update.
         
         if (newQuantity < ReservedQty)
         {
             throw new DomainException($"Cannot adjust stock to {newQuantity} because {ReservedQty} are reserved.");
         }

         QuantityOnHand = newQuantity;
    }
}
