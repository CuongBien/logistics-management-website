using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Identity.Commands.UpdateRolePermissions;

public class UpdateRolePermissionsHandler : IRequestHandler<UpdateRolePermissionsCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public UpdateRolePermissionsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(UpdateRolePermissionsCommand request, CancellationToken cancellationToken)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == request.RoleId, cancellationToken);

        if (role == null)
        {
            return Result<Guid>.Failure(Error.NotFound("Role.NotFound", $"Role with ID {request.RoleId} not found."));
        }

        // Clear all existing permissions
        role.ClearPermissions();

        // Add the selected permissions
        if (request.PermissionIds.Any())
        {
            var permissionsToAdd = await _context.Permissions
                .Where(p => request.PermissionIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var permission in permissionsToAdd)
            {
                role.AddPermission(permission);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(role.Id);
    }
}
