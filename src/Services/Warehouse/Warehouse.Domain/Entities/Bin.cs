using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class Bin : Entity<Guid>
{
    public Guid WarehouseId { get; private set; }
    public Guid ZoneId { get; private set; }
    public string BinCode { get; private set; } = default!;
    public string Status { get; private set; } = default!;
    public Guid? CurrentOrderId { get; private set; }
    public int Version { get; private set; }

    // Navigation
    public Zone Zone { get; private set; } = default!;

    // EF Core
    private Bin() { }

    public Bin(Guid warehouseId, Guid zoneId, string binCode, BinStatus status = BinStatus.Available)
    {
        Id = Guid.NewGuid();
        WarehouseId = warehouseId;
        ZoneId = zoneId;
        BinCode = binCode;
        Status = status.ToString();
        Version = 1;
    }

    public void UpdateStatus(BinStatus newStatus)
    {
        Status = newStatus.ToString();
        Version++;
    }

    public void AssignOrder(Guid orderId)
    {
        CurrentOrderId = orderId;
        Status = BinStatus.Occupied.ToString();
        Version++;
    }

    public void Release()
    {
        CurrentOrderId = null;
        Status = BinStatus.Available.ToString();
        Version++;
    }
}