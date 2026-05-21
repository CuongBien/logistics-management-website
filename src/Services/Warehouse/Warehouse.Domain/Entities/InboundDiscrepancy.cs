using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InboundDiscrepancy : Entity<Guid>
{
    public Guid ReceiptId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public string Sku { get; private set; } = default!;
    public int ExpectedQty { get; private set; }
    public int ReceivedQty { get; private set; }
    public int DiscrepancyQty { get; private set; }
    public string OperatorId { get; private set; } = default!;
    public InboundDiscrepancyStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string? Notes { get; private set; }

    private InboundDiscrepancy() { }

    public InboundDiscrepancy(
        Guid receiptId,
        Guid warehouseId,
        string sku,
        int expectedQty,
        int receivedQty,
        string operatorId,
        string? notes = null)
    {
        Id = Guid.NewGuid();
        ReceiptId = receiptId;
        WarehouseId = warehouseId;
        Sku = sku;
        ExpectedQty = expectedQty;
        ReceivedQty = receivedQty;
        DiscrepancyQty = expectedQty - receivedQty;
        OperatorId = operatorId;
        Status = InboundDiscrepancyStatus.PendingInvestigation;
        CreatedAt = DateTime.UtcNow;
        Notes = notes;
    }

    public void Resolve(InboundDiscrepancyStatus newStatus, string? resolutionNotes)
    {
        if (Status != InboundDiscrepancyStatus.PendingInvestigation)
        {
            throw new InvalidOperationException(
                $"Cannot resolve discrepancy in status '{Status}'. Only discrepancies in 'PendingInvestigation' status can be resolved.");
        }

        if (newStatus == InboundDiscrepancyStatus.PendingInvestigation)
        {
            throw new InvalidOperationException(
                "Cannot resolve a discrepancy back to 'PendingInvestigation'. Must choose a terminal resolution status.");
        }

        Status = newStatus;
        if (!string.IsNullOrWhiteSpace(resolutionNotes))
        {
            Notes = string.IsNullOrWhiteSpace(Notes) 
                ? resolutionNotes 
                : $"{Notes} | Resolution: {resolutionNotes}";
        }
    }
}
