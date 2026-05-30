using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Identity.Commands.CreateRole;

public class CreateRoleCommand : IRequest<Result<Guid>>
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public List<Guid> PermissionIds { get; set; } = new();
}
