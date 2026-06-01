using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Features.Identity.DTOs;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Queries.GetPermissions;

public class GetPermissionsHandler : IRequestHandler<GetPermissionsQuery, Result<List<PermissionDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetPermissionsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<PermissionDto>>> Handle(GetPermissionsQuery request, CancellationToken cancellationToken)
    {
        var permissions = await _context.Permissions
            .AsNoTracking()
            .Select(p => new PermissionDto
            {
                Id = p.Id,
                Code = p.Code,
                Resource = p.Resource,
                Action = p.Action
            })
            .ToListAsync(cancellationToken);

        return Result<List<PermissionDto>>.Success(permissions);
    }
}
