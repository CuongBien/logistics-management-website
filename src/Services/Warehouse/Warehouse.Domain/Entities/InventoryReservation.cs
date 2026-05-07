using System;
using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum InventoryReservationStatus
{
    Active,
    Released,
    Consumed,
    Expired,
    Cancelled
}

public class InventoryReservation : Entity<Guid>
{
    // EF Core
    private InventoryReservation() { }

    public static InventoryReservation Create(Guid outboundLineId, Guid inventoryItemId, int reservedQty, DateTime? expiresAt = null)
    {
        if (reservedQty <= 0) throw new ArgumentOutOfRangeException(nameof(reservedQty));

        return new InventoryReservation
        {
            Id = Guid.NewGuid(),
            OutboundLineId = outboundLineId,
            InventoryItemId = inventoryItemId,
            ReservedQty = reservedQty,
            Status = InventoryReservationStatus.Active,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };
    }

    public Guid OutboundLineId { get; private set; }
    public Guid InventoryItemId { get; private set; }
    public int ReservedQty { get; private set; }
    public InventoryReservationStatus Status { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // optional tracing
    public string? ReferenceType { get; private set; }
    public string? ReferenceId { get; private set; }
    public string? CorrelationId { get; private set; }

    public void MarkReleased()
    {
        if (Status != InventoryReservationStatus.Active) return;
        Status = InventoryReservationStatus.Released;
    }

    public void MarkConsumed()
    {
        if (Status != InventoryReservationStatus.Active) throw new InvalidOperationException("Only active reservation can be consumed");
        Status = InventoryReservationStatus.Consumed;
    }

    public void MarkExpired()
    {
        if (Status != InventoryReservationStatus.Active) return;
        Status = InventoryReservationStatus.Expired;
    }

    public void SetCorrelation(string? referenceType, string? referenceId, string? correlationId)
    {
        ReferenceType = referenceType;
        ReferenceId = referenceId;
        CorrelationId = correlationId;
    }
}
