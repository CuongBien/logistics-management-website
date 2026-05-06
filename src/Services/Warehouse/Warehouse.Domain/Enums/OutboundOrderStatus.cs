namespace Warehouse.Domain.Enums;

public enum OutboundOrderStatus
{
    Pending = 0,
    Picking = 1,
    Packed = 2,
    Shipped = 3,
    Cancelled = 4
}
