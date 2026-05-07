using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Role : Entity<Guid>, IAggregateRoot
{
    public string Code { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public bool IsActive { get; private set; }

    private readonly List<RolePermission> _rolePermissions = new();
    public IReadOnlyCollection<RolePermission> RolePermissions => _rolePermissions.AsReadOnly();

    private readonly List<OperatorRoleAssignment> _assignments = new();
    public IReadOnlyCollection<OperatorRoleAssignment> Assignments => _assignments.AsReadOnly();

    private Role() { }

    public Role(string code, string name)
    {
        Id = Guid.NewGuid();
        Code = code;
        Name = name;
        IsActive = true;
    }

    public void AddPermission(Permission permission)
    {
        if (_rolePermissions.Any(rp => rp.PermissionId == permission.Id)) return;
        _rolePermissions.Add(new RolePermission(Id, permission.Id));
    }
}
