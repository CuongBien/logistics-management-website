namespace OMS.Domain.Enums;

public enum OrderStatus
{
    New = 1,
    Confirmed = 2,
    Allocated = 3,
    PickPack = 4,
    Handover = 5,
    Delivering = 6,
    Completed = 7,
    Cancelled = 8
}
