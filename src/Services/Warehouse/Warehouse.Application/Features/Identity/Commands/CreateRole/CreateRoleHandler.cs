using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Commands.CreateRole;

public class CreateRoleHandler : IRequestHandler<CreateRoleCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateRoleHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Roles.AnyAsync(r => r.Code == request.Code, cancellationToken))
        {
            return Result<Guid>.Failure(Error.Conflict("Role.Conflict", $"Role code '{request.Code}' already exists."));
        }

        var role = new Role(request.Code, request.Name);

        if (request.PermissionIds.Any())
        {
            var permissions = await _context.Permissions
                .Where(p => request.PermissionIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var permission in permissions)
            {
                role.AddPermission(permission);
            }
        }

        _context.Roles.Add(role);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(role.Id);
    }
}
