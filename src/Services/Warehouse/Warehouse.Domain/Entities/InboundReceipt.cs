using Logistics.Core;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Events;

namespace Warehouse.Domain.Entities;

public class InboundReceipt : Entity<Guid>, IAggregateRoot, ISoftDelete
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public Guid WarehouseId { get; private set; }
    public string ReceiptNo { get; private set; } = default!;
    public string? ShipmentNo { get; private set; }
    public string SourceType { get; private set; } = default!;
    public string SourceRef { get; private set; } = default!;
    public InboundReceiptStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? ReceivedAt { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    // Navigation
    private readonly List<InboundReceiptLine> _lines = new();
    public IReadOnlyCollection<InboundReceiptLine> Lines => _lines.AsReadOnly();

    // EF Core
    private InboundReceipt() { }

    public InboundReceipt(string tenantId, string customerId, Guid warehouseId, string receiptNo, string sourceType, string sourceRef, string? shipmentNo = null)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        CustomerId = customerId;
        WarehouseId = warehouseId;
        ReceiptNo = receiptNo;
        ShipmentNo = shipmentNo;
        SourceType = sourceType;
        SourceRef = sourceRef;
        Status = InboundReceiptStatus.Pending;
        CreatedAt = DateTime.UtcNow;
        IsDeleted = false;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
    }

    public void AddLine(InboundReceiptLine line)
    {
        _lines.Add(line);
        RecalculateStatus();
    }

    public void StartReceiving()
    {
        if (Status == InboundReceiptStatus.Pending || Status == InboundReceiptStatus.Draft)
        {
            Status = InboundReceiptStatus.Receiving;
        }
    }

    public void RecalculateStatus()
    {
        var oldStatus = Status;

        if (_lines.Count == 0)
        {
            Status = InboundReceiptStatus.Pending;
            return;
        }

        bool allCompleted = true;
        bool hasExceptions = false;
        bool isReceiving = false;

        foreach (var line in _lines)
        {
            if (line.Status == InboundReceiptLineStatus.PartiallyReceived)
            {
                isReceiving = true;
            }

            if (line.Status != InboundReceiptLineStatus.Completed)
            {
                allCompleted = false;
            }

            if (line.RejectedQty > 0 || line.ShortageQty > 0)
            {
                hasExceptions = true;
            }
        }

        if (allCompleted)
        {
            Status = hasExceptions ? InboundReceiptStatus.CompletedWithExceptions : InboundReceiptStatus.Completed;
            ReceivedAt ??= DateTime.UtcNow;

            // Emit completion event if status transitioned to a final state
            if (oldStatus != InboundReceiptStatus.Completed && oldStatus != InboundReceiptStatus.CompletedWithExceptions)
            {
                var discrepancies = _lines.Select(l => new InboundDiscrepancyInfo(
                    l.SkuCode,
                    l.ExpectedQty,
                    l.ReceivedQty,
                    l.RejectedQty,
                    l.ShortageQty,
                    null
                )).ToList();

                AddDomainEvent(new InboundReceiptCompletedDomainEvent(
                    Id,
                    WarehouseId,
                    SourceRef,
                    Status,
                    discrepancies
                ));
            }
        }
        else if (isReceiving)
        {
            Status = InboundReceiptStatus.Receiving;
            ReceivedAt = null;
        }
        else
        {
            Status = InboundReceiptStatus.Pending;
            ReceivedAt = null;
        }
    }
}