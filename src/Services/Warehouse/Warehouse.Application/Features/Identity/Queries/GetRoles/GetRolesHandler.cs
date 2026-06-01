using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Features.Identity.DTOs;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Queries.GetRoles;

public class GetRolesHandler : IRequestHandler<GetRolesQuery, Result<List<RoleDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetRolesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<RoleDto>>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _context.Roles
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dtos = roles.Select(r => new RoleDto
        {
            Id = r.Id,
            Code = r.Code,
            Name = r.Name,
            Permissions = r.RolePermissions.Select(rp => new PermissionDto
            {
                Id = rp.Permission.Id,
                Code = rp.Permission.Code,
                Resource = rp.Permission.Resource,
                Action = rp.Permission.Action
            }).ToList()
        }).ToList();

        return Result<List<RoleDto>>.Success(dtos);
    }
}
