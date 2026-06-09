using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Queries.GetRoleAssignments;

public class GetRoleAssignmentsQueryHandler : IRequestHandler<GetRoleAssignmentsQuery, Result<List<RoleAssignmentDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetRoleAssignmentsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<RoleAssignmentDto>>> Handle(GetRoleAssignmentsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        // Note: The controller already verifies the user has role:manage in at least one warehouse.
        // If they pass that check, they can see all staff across all warehouses for management purposes.

        var query = _context.OperatorRoleAssignments
            .Include(a => a.OperatorProfile)
            .Include(a => a.Role)
            .Include(a => a.Warehouse)
            .Where(a => a.Status == Domain.Entities.AssignmentStatus.Active);

        var assignments = await query
            .Select(a => new RoleAssignmentDto(
                a.Id,
                a.OperatorProfile.OperatorSub,
                a.WarehouseId.ToString(),
                a.Warehouse.Name,
                a.Role.Name,
                a.Role.Code,
                a.OperatorProfile.FullName,
                a.OperatorProfile.Email,
                a.OperatorProfile.Phone,
                a.OperatorProfile.EmployeeCode
            ))
            .ToListAsync(cancellationToken);

        return Result<List<RoleAssignmentDto>>.Success(assignments);
    }
}
