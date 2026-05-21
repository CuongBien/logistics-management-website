namespace Warehouse.Domain.Enums;

public enum InboundDiscrepancyStatus
{
    PendingInvestigation = 1,
    MerchantLiability = 2,
    WarehouseWriteOff = 3,
    Resolved = 4,
    OverageAbsorbed = 5,
    OverageReturnedToMerchant = 6
}
