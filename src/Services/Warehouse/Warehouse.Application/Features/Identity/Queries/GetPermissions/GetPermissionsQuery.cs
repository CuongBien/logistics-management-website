using Logistics.Core;
using MediatR;
using Warehouse.Application.Features.Identity.DTOs;

namespace Warehouse.Application.Features.Identity.Queries.GetPermissions;

public class GetPermissionsQuery : IRequest<Result<List<PermissionDto>>>
{
}
