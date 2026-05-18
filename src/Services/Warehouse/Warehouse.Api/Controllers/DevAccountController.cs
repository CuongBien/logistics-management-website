using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/dev/account")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class DevAccountController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache _cache;

    public DevAccountController(IApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    /// <summary>
    /// Gán quyền Admin cho User hiện tại (Dùng cho DEV/Postman)
    /// </summary>
    [HttpPost("setup-admin")]
    public async Task<IActionResult> SetupAdmin()
    {
        // Kiểm tra nhiều loại claim ID phổ biến
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                 ?? User.FindFirst("sub")?.Value
                 ?? User.FindFirst("oid")?.Value // Azure AD
                 ?? User.Identity?.Name;
        
        if (string.IsNullOrEmpty(sub))
        {
            var claims = User.Claims.Select(c => $"{c.Type}: {c.Value}").ToList();
            return BadRequest(new { 
                Error = "Token missing sub/nameid claim", 
                AvailableClaims = claims,
                IsAuthenticated = User.Identity?.IsAuthenticated 
            });
        }

        var profile = await _context.OperatorProfiles.FirstOrDefaultAsync(p => p.OperatorSub == sub);
        if (profile == null)
            return NotFound("OperatorProfile not found. Please run any other API request first to trigger JIT provisioning.");

        // 1. Tìm hoặc tạo Role 'Admin'
        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Code == "admin");
        if (adminRole == null)
        {
            adminRole = new Role("admin", "Administrator Role");
            _context.Roles.Add(adminRole);
            await _context.SaveChangesAsync(HttpContext.RequestAborted);
        }

        // 2. Gán TẤT CẢ Permissions cho Role này
        var allPermissions = await _context.Permissions.ToListAsync();
        foreach (var p in allPermissions)
        {
            if (!await _context.RolePermissions.AnyAsync(rp => rp.RoleId == adminRole.Id && rp.PermissionId == p.Id))
            {
                _context.RolePermissions.Add(new RolePermission(adminRole.Id, p.Id));
            }
        }

        // 3. Gán Role Admin cho User hiện tại tại tất cả Warehouses
        var warehouses = await _context.Warehouses.ToListAsync();
        foreach (var w in warehouses)
        {
            var exists = await _context.OperatorRoleAssignments.AnyAsync(a => 
                a.OperatorProfileId == profile.Id && 
                a.RoleId == adminRole.Id && 
                a.WarehouseId == w.Id);

            if (!exists)
            {
                _context.OperatorRoleAssignments.Add(new OperatorRoleAssignment(profile.Id, adminRole.Id, w.Id, null));
            }
        }

        await _context.SaveChangesAsync(HttpContext.RequestAborted);
        _cache.Remove($"permissions_{sub}");
        return Ok(new { Message = "Admin rights granted for all warehouses.", OperatorSub = sub });
    }
}
