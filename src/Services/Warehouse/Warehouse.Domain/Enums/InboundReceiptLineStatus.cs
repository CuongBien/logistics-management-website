namespace Warehouse.Domain.Enums;

public enum InboundReceiptLineStatus
{
    Pending = 0,
    PartiallyReceived = 1,
    Quarantined = 2,
    Completed = 3
}
