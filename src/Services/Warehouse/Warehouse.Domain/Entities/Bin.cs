using Logistics.Core;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class Bin : Entity<Guid>, ISoftDelete
{
    public Guid WarehouseId { get; private set; }
    public Guid ZoneId { get; private set; }
    public string BinCode { get; private set; } = default!;
    public string Status { get; private set; } = default!;
    public Guid? CurrentOrderId { get; private set; }
    public int Version { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    public string? Aisle { get; private set; }
    public string? Rack { get; private set; }
    public string? Shelf { get; private set; }
    public int PickSequence { get; private set; }
    
    // Navigation
    public Zone Zone { get; private set; } = default!;

    // EF Core
    private Bin() { }

    public Bin(Guid warehouseId, Guid zoneId, string binCode, BinStatus status = BinStatus.Available, string? aisle = null, string? rack = null, string? shelf = null, int pickSequence = 0)
    {
        Id = Guid.NewGuid();
        WarehouseId = warehouseId;
        ZoneId = zoneId;
        BinCode = binCode;
        Status = status.ToString();
        Version = 1;
        IsDeleted = false;
        
        Aisle = aisle;
        Rack = rack;
        Shelf = shelf;
        PickSequence = pickSequence;
    }

    public void UpdateLocation(string? aisle, string? rack, string? shelf, int pickSequence)
    {
        Aisle = aisle;
        Rack = rack;
        Shelf = shelf;
        PickSequence = pickSequence;
        Version++;
    }

    public void Delete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
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