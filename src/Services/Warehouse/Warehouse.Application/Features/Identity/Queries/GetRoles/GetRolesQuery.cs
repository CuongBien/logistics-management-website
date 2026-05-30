using Logistics.Core;
using MediatR;
using Warehouse.Application.Features.Identity.DTOs;

namespace Warehouse.Application.Features.Identity.Queries.GetRoles;

public class GetRolesQuery : IRequest<Result<List<RoleDto>>>
{
}
