using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class DispositionLog : Entity<Guid>
{
    public Guid InventoryItemId { get; private set; }
    public Guid? InboundLineId { get; private set; }
    public InventoryStatus InventoryStatus { get; private set; }
    public DispositionStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string? Notes { get; private set; }

    // Navigation
    public InventoryItem InventoryItem { get; private set; } = default!;

    private DispositionLog() { }

    public DispositionLog(Guid inventoryItemId, InventoryStatus inventoryStatus, DispositionStatus status, Guid? inboundLineId = null, string? notes = null)
    {
        Id = Guid.NewGuid();
        InventoryItemId = inventoryItemId;
        InventoryStatus = inventoryStatus;
        Status = status;
        InboundLineId = inboundLineId;
        CreatedAt = DateTime.UtcNow;
        Notes = notes;
    }
    
    public void UpdateStatus(DispositionStatus newStatus, string? notes = null)
    {
        Status = newStatus;
        if (!string.IsNullOrEmpty(notes))
        {
            Notes = string.IsNullOrEmpty(Notes) ? notes : $"{Notes} | {notes}";
        }
    }
}
