using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class OperatorProfile : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string OperatorSub { get; private set; } = default!;
    public string DisplayName { get; private set; } = default!;
    public bool IsActive { get; private set; }

    private readonly List<OperatorWarehouseScope> _warehouseScopes = new();
    public IReadOnlyCollection<OperatorWarehouseScope> WarehouseScopes => _warehouseScopes.AsReadOnly();

    private readonly List<OperatorRoleAssignment> _roleAssignments = new();
    public IReadOnlyCollection<OperatorRoleAssignment> RoleAssignments => _roleAssignments.AsReadOnly();

    private OperatorProfile() { }

    public OperatorProfile(string tenantId, string operatorSub, string displayName)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        OperatorSub = operatorSub;
        DisplayName = displayName;
        IsActive = true;
    }
}
