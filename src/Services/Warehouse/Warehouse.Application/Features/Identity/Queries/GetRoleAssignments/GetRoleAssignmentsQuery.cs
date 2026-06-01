using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Identity.Queries.GetRoleAssignments;

public record RoleAssignmentDto(string OperatorSub, string WarehouseId, string RoleName);

public record GetRoleAssignmentsQuery : IRequest<Result<List<RoleAssignmentDto>>>;
