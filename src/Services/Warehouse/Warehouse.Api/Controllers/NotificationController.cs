using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Logistics.Core;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public NotificationsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int limit = 50)
    {
        var warehouseIdStr = User.FindFirst("warehouse_id")?.Value;
        Guid? warehouseId = null;
        if (Guid.TryParse(warehouseIdStr, out var wid))
        {
            warehouseId = wid;
        }

        var query = _context.Notifications.AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(n => n.WarehouseId == null || n.WarehouseId == warehouseId);
        }

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new
            {
                n.Id,
                n.Title,
                n.Message,
                Type = n.Type.ToString().ToLower(),
                Category = n.Category.ToString(),
                n.CreatedAt,
                n.IsRead
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpPost("mark-all-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var warehouseIdStr = User.FindFirst("warehouse_id")?.Value;
        Guid? warehouseId = null;
        if (Guid.TryParse(warehouseIdStr, out var wid))
        {
            warehouseId = wid;
        }

        var query = _context.Notifications.Where(n => !n.IsRead);
        if (warehouseId.HasValue)
        {
            query = query.Where(n => n.WarehouseId == null || n.WarehouseId == warehouseId);
        }

        var unread = await query.ToListAsync();
        foreach (var n in unread)
        {
            n.MarkAsRead();
        }

        await _context.SaveChangesAsync(default);
        return Ok(new { success = true });
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null) return NotFound();

        notification.MarkAsRead();
        await _context.SaveChangesAsync(default);

        return Ok(new { success = true });
    }
}
