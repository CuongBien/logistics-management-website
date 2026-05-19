using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Identity;

public class OperatorAuthorizationService : IOperatorAuthorizationService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public OperatorAuthorizationService(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<bool> HasPermissionAsync(string operatorSub, Guid warehouseId, Guid? zoneId, string permissionCode, CancellationToken cancellationToken = default)
    {
        if (string.Equals(operatorSub, "System", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var cacheKey = $"permissions_{operatorSub}";

        if (!_cache.TryGetValue(cacheKey, out List<PermissionInfo> permissions))
        {
            permissions = await GetPermissionsFromDbAsync(operatorSub, cancellationToken);
            _cache.Set(cacheKey, permissions, CacheDuration);
        }

        return permissions.Any(p => 
            p.WarehouseId == warehouseId && 
            (p.ZoneId == null || p.ZoneId == zoneId) && 
            p.PermissionCode == permissionCode);
    }

    private async Task<List<PermissionInfo>> GetPermissionsFromDbAsync(string operatorSub, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        return await _context.OperatorRoleAssignments
            .Where(a => a.OperatorProfile.OperatorSub == operatorSub && 
                        a.Status == AssignmentStatus.Active &&
                        (a.EffectiveFrom == null || a.EffectiveFrom <= now) &&
                        (a.EffectiveTo == null || a.EffectiveTo >= now))
            .SelectMany(a => a.Role.RolePermissions.Select(rp => new PermissionInfo
            {
                WarehouseId = a.WarehouseId,
                ZoneId = a.ZoneId,
                PermissionCode = rp.Permission.Code
            }))
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    private class PermissionInfo
    {
        public Guid WarehouseId { get; set; }
        public Guid? ZoneId { get; set; }
        public string PermissionCode { get; set; } = default!;
    }
}
