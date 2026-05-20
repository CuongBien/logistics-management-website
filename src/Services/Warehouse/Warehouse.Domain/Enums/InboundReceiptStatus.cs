namespace Warehouse.Domain.Enums;

public enum InboundReceiptStatus
{
    Draft = 0,
    Pending = 1,
    Receiving = 2,
    Completed = 3,
    CompletedWithExceptions = 4,
    Closed = 5,
    Cancelled = 6
}
