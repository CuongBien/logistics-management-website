using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Identity.Commands.UpdateRolePermissions;

public class UpdateRolePermissionsCommand : IRequest<Result<Guid>>
{
    public Guid RoleId { get; set; }
    public List<Guid> PermissionIds { get; set; } = new();
}
