namespace Warehouse.Domain.Enums;

public enum ReservationStatus
{
    Active = 1,
    Consumed = 2,
    Released = 3,
    Expired = 4
}

public enum ReservationType
{
    OutboundOrder = 1,
    Transfer = 2,
    Adjustment = 3,
    Other = 99
}
