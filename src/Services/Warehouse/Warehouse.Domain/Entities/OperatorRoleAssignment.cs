using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum AssignmentStatus
{
    Active = 1,
    Inactive = 0
}

public class OperatorRoleAssignment : Entity<Guid>
{
    public Guid OperatorProfileId { get; private set; }
    public Guid RoleId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public Guid? ZoneId { get; private set; }
    public DateTime? EffectiveFrom { get; private set; }
    public DateTime? EffectiveTo { get; private set; }
    public AssignmentStatus Status { get; private set; }

    // Navigation
    public OperatorProfile OperatorProfile { get; private set; } = default!;
    public Role Role { get; private set; } = default!;
    public Domain.Entities.Warehouse Warehouse { get; private set; } = default!;
    public Zone? Zone { get; private set; }

    private OperatorRoleAssignment() { }

    public OperatorRoleAssignment(Guid operatorProfileId, Guid roleId, Guid warehouseId, Guid? zoneId)
    {
        Id = Guid.NewGuid();
        OperatorProfileId = operatorProfileId;
        RoleId = roleId;
        WarehouseId = warehouseId;
        ZoneId = zoneId;
        Status = AssignmentStatus.Active;
        EffectiveFrom = DateTime.UtcNow;
    }

    public bool IsActive()
    {
        if (Status != AssignmentStatus.Active) return false;
        var now = DateTime.UtcNow;
        if (EffectiveFrom.HasValue && now < EffectiveFrom.Value) return false;
        if (EffectiveTo.HasValue && now > EffectiveTo.Value) return false;
        return true;
    }
}
