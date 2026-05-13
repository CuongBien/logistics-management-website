using Logistics.Core;
using System.ComponentModel.DataAnnotations;
using Warehouse.Domain.Exceptions;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InventoryItem : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public Guid BinId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int QuantityOnHand { get; private set; }
    public int ReservedQty { get; private set; }
    public int AvailableQty => QuantityOnHand - ReservedQty;
    public InventoryStatus Status { get; private set; }
    public DateTime? LastRestockedAt { get; private set; }
    public int Version { get; private set; }

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
            Status = InventoryStatus.Available,
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

    public DispositionLog ChangeStatus(InventoryStatus newStatus, DispositionStatus dispositionStatus, Guid? inboundLineId = null, string? notes = null)
    {
        if (Status == newStatus) return null!; // Or handle based on domain rules

        Status = newStatus;
        Version++;
        
        return new DispositionLog(Id, newStatus, dispositionStatus, inboundLineId, notes);
    }
}
