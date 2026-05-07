using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InventoryReservation : Entity<Guid>
{
    public Guid InventoryItemId { get; private set; }
    public string ReferenceId { get; private set; } = default!;
    public ReservationType ReferenceType { get; private set; }
    public int Quantity { get; private set; }
    public ReservationStatus Status { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public string? CorrelationId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // Navigation property
    public virtual InventoryItem InventoryItem { get; private set; } = default!;

    // EF Core
    private InventoryReservation() { }

    public static InventoryReservation Create(
        Guid inventoryItemId, 
        string referenceId, 
        ReservationType referenceType, 
        int quantity, 
        TimeSpan ttl,
        string? correlationId = null)
    {
        if (quantity <= 0) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (string.IsNullOrWhiteSpace(referenceId)) throw new ArgumentNullException(nameof(referenceId));

        var now = DateTime.UtcNow;
        return new InventoryReservation
        {
            Id = Guid.NewGuid(),
            InventoryItemId = inventoryItemId,
            ReferenceId = referenceId,
            ReferenceType = referenceType,
            Quantity = quantity,
            Status = ReservationStatus.Active,
            CreatedAt = now,
            ExpiresAt = now.Add(ttl),
            CorrelationId = correlationId
        };
    }

    public bool MarkAsConsumed()
    {
        if (Status != ReservationStatus.Active) return false;
        Status = ReservationStatus.Consumed;
        return true;
    }

    public bool MarkAsReleased()
    {
        if (Status != ReservationStatus.Active) return false;
        Status = ReservationStatus.Released;
        return true;
    }

    public bool MarkAsExpired()
    {
        if (Status != ReservationStatus.Active) return false;
        Status = ReservationStatus.Expired;
        return true;
    }

    public bool IsExpired() => Status == ReservationStatus.Active && DateTime.UtcNow > ExpiresAt;
}
