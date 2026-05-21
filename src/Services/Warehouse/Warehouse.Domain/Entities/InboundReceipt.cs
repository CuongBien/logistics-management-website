using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class InboundReceipt : Entity<Guid>, IAggregateRoot, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public string ReceiptNo { get; private set; } = default!;
    public DateTime CreatedAt { get; private set; }
    public string? SourceShipmentNo { get; private set; }
    public Guid OrderId { get; private set; }
    public InboundReceiptStatus Status { get; private set; }
    public DateTime? ReceivedAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    /// <summary>
    /// For cross-region consignment: the final destination warehouse where goods should end up.
    /// Null for standard local inbound receipts.
    /// </summary>
    public Guid? FinalDestinationWarehouseId { get; private set; }
    
    public string? CreatedByOperatorId { get; private set; }

    // Navigation
    private readonly List<InboundReceiptLine> _lines = new();
    public IReadOnlyCollection<InboundReceiptLine> Lines => _lines.AsReadOnly();

    // EF Core
    private InboundReceipt() { }

    public InboundReceipt(Guid orderId, string tenantId, string customerId, Guid warehouseId, string receiptNo, string? sourceShipmentNo, string? createdByOperatorId = null)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = warehouseId;
        ReceiptNo = receiptNo;
        CreatedAt = DateTime.UtcNow;
        SourceShipmentNo = sourceShipmentNo;
        Status = InboundReceiptStatus.Pending;
        IsDeleted = false;
        CreatedByOperatorId = createdByOperatorId;
    }

    public void SetFinalDestination(Guid warehouseId)
    {
        FinalDestinationWarehouseId = warehouseId;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(InboundReceiptStatus status)
    {
        Status = status;
        if (status == InboundReceiptStatus.Received || status == InboundReceiptStatus.CompletedWithExceptions)
        {
            ReceivedAt = DateTime.UtcNow;
        }
    }

    public void RecalculateStatus()
    {
        if (_lines.Count == 0)
        {
            Status = InboundReceiptStatus.Pending;
            return;
        }

        bool allReceived = true;
        bool anyReceived = false;
        bool hasOverage = false;

        foreach (var line in _lines)
        {
            if (line.ReceivedQuantity > 0)
            {
                anyReceived = true;
            }
            if (line.ReceivedQuantity < line.ExpectedQuantity)
            {
                allReceived = false;
            }
            // BUG-10 FIX: Detect overage — received more than expected
            if (line.ReceivedQuantity > line.ExpectedQuantity)
            {
                hasOverage = true;
            }
        }

        if (allReceived && hasOverage)
        {
            // All lines met or exceeded expectations, but at least one has overage
            Status = InboundReceiptStatus.CompletedWithExceptions;
            ReceivedAt = DateTime.UtcNow;
        }
        else if (allReceived)
        {
            Status = InboundReceiptStatus.Received;
            ReceivedAt = DateTime.UtcNow;
        }
        else if (anyReceived)
        {
            Status = InboundReceiptStatus.PartiallyReceived;
            ReceivedAt = null;
        }
        else
        {
            Status = InboundReceiptStatus.Pending;
        }
    }

    public void ForceClose()
    {
        if (Status == InboundReceiptStatus.Received || Status == InboundReceiptStatus.Closed || Status == InboundReceiptStatus.Cancelled || Status == InboundReceiptStatus.CompletedWithExceptions)
        {
            return; // Already closed
        }

        Status = InboundReceiptStatus.CompletedWithExceptions;
        ReceivedAt = DateTime.UtcNow;
    }

    public void AddLine(InboundReceiptLine line)
    {
        _lines.Add(line);
    }
}