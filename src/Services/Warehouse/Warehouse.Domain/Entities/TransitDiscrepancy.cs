using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class TransitDiscrepancy : Entity<Guid>
{
    public Guid OutboundOrderId { get; private set; }
    public Guid ShipmentId { get; private set; }
    public Guid WarehouseId { get; private set; } // The hub warehouse where discrepancy was detected
    public string Sku { get; private set; } = default!;
    public int ShippedQty { get; private set; }
    public int ReceivedQty { get; private set; }
    public int DiscrepancyQty { get; private set; }
    public string Carrier { get; private set; } = default!;
    public string OperatorId { get; private set; } = default!;
    public TransitDiscrepancyStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string? Notes { get; private set; }

    // Navigation properties for EF Core if needed, keeping it simple as a flat auditing ledger
    
    private TransitDiscrepancy() { }

    public TransitDiscrepancy(
        Guid outboundOrderId,
        Guid shipmentId,
        Guid warehouseId,
        string sku,
        int shippedQty,
        int receivedQty,
        string carrier,
        string operatorId,
        string? notes = null)
    {
        Id = Guid.NewGuid();
        OutboundOrderId = outboundOrderId;
        ShipmentId = shipmentId;
        WarehouseId = warehouseId;
        Sku = sku;
        ShippedQty = shippedQty;
        ReceivedQty = receivedQty;
        DiscrepancyQty = shippedQty - receivedQty;
        Carrier = string.IsNullOrWhiteSpace(carrier) ? "N/A" : carrier;
        OperatorId = operatorId;
        Status = TransitDiscrepancyStatus.PendingInvestigation;
        CreatedAt = DateTime.UtcNow;
        Notes = notes;
    }

    public void Resolve(TransitDiscrepancyStatus newStatus, string? resolutionNotes)
    {
        Status = newStatus;
        if (!string.IsNullOrWhiteSpace(resolutionNotes))
        {
            Notes = string.IsNullOrWhiteSpace(Notes) 
                ? resolutionNotes 
                : $"{Notes} | Resolution: {resolutionNotes}";
        }
    }
}
