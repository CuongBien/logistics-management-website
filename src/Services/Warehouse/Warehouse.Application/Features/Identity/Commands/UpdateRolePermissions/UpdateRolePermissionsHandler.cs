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

        // Remove existing permissions that are not in the new list
        var permissionsToRemove = role.RolePermissions
            .Where(rp => !request.PermissionIds.Contains(rp.PermissionId))
            .ToList();
            
        // We can't remove directly from RolePermissions readonly collection in entity,
        // so we remove from the DbContext DbSet directly
        if (permissionsToRemove.Any())
        {
            _context.RolePermissions.RemoveRange(permissionsToRemove);
        }

        // Add new permissions
        var existingPermissionIds = role.RolePermissions.Select(rp => rp.PermissionId).ToList();
        var newPermissionIds = request.PermissionIds.Except(existingPermissionIds).ToList();

        if (newPermissionIds.Any())
        {
            var permissionsToAdd = await _context.Permissions
                .Where(p => newPermissionIds.Contains(p.Id))
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
