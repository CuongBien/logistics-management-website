using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Commands.DeleteRole;

public class DeleteRoleHandler : IRequestHandler<DeleteRoleCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public DeleteRoleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        // 1. Find role
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken);

        if (role == null)
        {
            return Result<bool>.Failure(Error.NotFound("Role.NotFound", $"Role with ID '{request.RoleId}' was not found."));
        }

        // 2. Remove any assignments to operators first to avoid orphaned data
        var assignments = await _context.OperatorRoleAssignments
            .Where(a => a.RoleId == role.Id)
            .ToListAsync(cancellationToken);

        if (assignments.Any())
        {
            _context.OperatorRoleAssignments.RemoveRange(assignments);
        }

        // 3. Remove Role (RolePermissions will cascade delete automatically)
        _context.Roles.Remove(role);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
