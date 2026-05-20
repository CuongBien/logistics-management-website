namespace Warehouse.Domain.Enums;

public enum OutboundOrderStatus
{
    Pending = 0,
    Processing = 1,
    Picked = 2,
    Packed = 3,
    Shipped = 4,
    Delivered = 5,
    Cancelled = 6
}
