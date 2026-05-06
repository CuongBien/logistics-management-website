namespace Warehouse.Domain.Enums;

public enum InboundReceiptStatus
{
    Draft = 0,
    Pending = 1,
    PartiallyReceived = 2,
    Received = 3,
    Closed = 4,
    Cancelled = 5,
    CompletedWithExceptions = 6
}
