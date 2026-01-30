namespace Logistics.Domain.Enums
{
    public enum ShipmentStatus
    {
        Pending = 0,
        PickedUp = 1,
        InTransit = 2,
        OutForDelivery = 3,
        Delivered = 4,
        FailedAttempt = 5,
        Returned = 6
    }
}
