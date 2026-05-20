using Logistics.Core;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Events;

public record InboundReceiptCompletedDomainEvent(
    Guid ReceiptId,
    Guid WarehouseId,
    string SourceRef,
    InboundReceiptStatus FinalStatus,
    List<InboundDiscrepancyInfo> Discrepancies
) : IDomainEvent
{
    public Guid EventId => Guid.NewGuid();
    public DateTime OccurredOn => DateTime.UtcNow;
}

public record InboundDiscrepancyInfo(
    string SkuCode,
    int ExpectedQty,
    int ReceivedQty,
    int RejectedQty,
    int ShortageQty,
    string? RejectionReason
);
