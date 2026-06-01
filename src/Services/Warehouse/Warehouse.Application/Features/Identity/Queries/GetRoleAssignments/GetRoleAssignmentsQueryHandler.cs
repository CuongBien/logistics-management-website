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
        var assignments = await _context.OperatorRoleAssignments
            .Include(a => a.OperatorProfile)
            .Include(a => a.Role)
            .Where(a => a.Status == Domain.Entities.AssignmentStatus.Active)
            .Select(a => new RoleAssignmentDto(
                a.OperatorProfile.OperatorSub,
                a.WarehouseId.ToString(),
                a.Role.Name
            ))
            .ToListAsync(cancellationToken);

        return Result<List<RoleAssignmentDto>>.Success(assignments);
    }
}
