using Logistics.Core;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Domain.Entities;

public class InventoryItem : Entity<Guid>, IAggregateRoot
{
[Required]
public string TenantId { get; private set; } = default!;
[Required]
public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }
    [Required]
    public string Sku { get; private set; } = default!;
    public int QuantityOnHand { get; private set; }
    public int ReservedQty { get; private set; }
    public int AvailableQty => QuantityOnHand - ReservedQty;
    public DateTime? LastRestockedAt { get; private set; }
    [ConcurrencyCheck]
    public int Version { get; private set; }

    // Navigation
    private readonly List<InventoryReservation> _reservations = new();
    public IReadOnlyCollection<InventoryReservation> Reservations => _reservations.AsReadOnly();

    // EF Core
    private InventoryItem() { }

    public static InventoryItem Create(string sku, int initialQty, string tenantId, string customerId, Guid warehouseId, Guid binId)
    {
        if (initialQty < 0) throw new ArgumentOutOfRangeException(nameof(initialQty));

        var inventory = new InventoryItem
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CustomerId = customerId,
            WarehouseId = warehouseId,
            BinId = binId,
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

    public void ConsumeReserved(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (ReservedQty < quantity) throw new InvalidOperationException("Not enough reserved quantity to consume");
        if (QuantityOnHand < quantity) throw new InsufficientStockException(Sku, quantity, QuantityOnHand);

        // adjust both on-hand and reserved atomically in this aggregate
        QuantityOnHand -= quantity;
        ReservedQty -= quantity;

        // ensure invariants
        if (QuantityOnHand < 0 || ReservedQty < 0 || ReservedQty > QuantityOnHand)
        {
            // revert
            QuantityOnHand += quantity;
            ReservedQty += quantity;
            throw new InvalidOperationException("Consume would violate inventory invariants");
        }

        Version++;
    }

    public void Deduct(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (QuantityOnHand < quantity) throw new InsufficientStockException(Sku, quantity, QuantityOnHand);

        QuantityOnHand -= quantity;
        // Ensure invariant: reserved cannot exceed on-hand after a deduction
        if (ReservedQty > QuantityOnHand)
        {
            // revert change to keep object in consistent state and surface error
            QuantityOnHand += quantity;
            throw new InvalidOperationException($"Operation would violate invariant: ReservedQty ({ReservedQty}) > QuantityOnHand ({QuantityOnHand - quantity}) after deduct");
        }

        Version++;
    }

    public void ReleaseReservation(int quantity)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (ReservedQty < quantity) throw new ArgumentOutOfRangeException(nameof(quantity), "Cannot release more than reserved quantity");

        ReservedQty -= quantity;
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
