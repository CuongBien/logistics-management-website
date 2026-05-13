using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class Permission : Entity<Guid>
{
    public string Code { get; private set; } = default!;
    public string Resource { get; private set; } = default!;
    public string Action { get; private set; } = default!;
    public bool IsActive { get; private set; }

    private readonly List<RolePermission> _rolePermissions = new();
    public IReadOnlyCollection<RolePermission> RolePermissions => _rolePermissions.AsReadOnly();

    private Permission() { }

    public Permission(string code, string resource, string action)
    {
        Id = Guid.NewGuid();
        Code = code;
        Resource = resource;
        Action = action;
        IsActive = true;
    }
}
