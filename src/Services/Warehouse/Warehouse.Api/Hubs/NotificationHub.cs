using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Warehouse.Api.Hubs;

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var warehouseId = Context.User?.Claims.FirstOrDefault(c => c.Type == "warehouse_id")?.Value;
        if (!string.IsNullOrEmpty(warehouseId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Warehouse_{warehouseId}");
        }

        var role = Context.User?.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Role_{role}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var warehouseId = Context.User?.Claims.FirstOrDefault(c => c.Type == "warehouse_id")?.Value;
        if (!string.IsNullOrEmpty(warehouseId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Warehouse_{warehouseId}");
        }

        var role = Context.User?.Claims.FirstOrDefault(c => c.Type == "role")?.Value;
        if (!string.IsNullOrEmpty(role))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Role_{role}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
