using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Ordering.Api.Hubs;

[Authorize]
public class OrderHub : Hub
{
    // The Hub simply pushes messages to clients.
    // We map Context.UserIdentifier to connection via DI (default behavior uses ClaimTypes.NameIdentifier).
    
    public override async Task OnConnectedAsync()
    {
        var logger = Context.GetHttpContext()?.RequestServices.GetRequiredService<ILogger<OrderHub>>();
        var sub = Context.User?.FindFirst("sub")?.Value;
        var nameIdentifier = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        logger?.LogInformation(
            "SignalR Client Connected! UserIdentifier: {UserIdentifier}, sub: {Sub}, nameIdentifier: {NameIdentifier}, ConnectionId: {ConnectionId}",
            Context.UserIdentifier, sub, nameIdentifier, Context.ConnectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Optional: log disconnection
        await base.OnDisconnectedAsync(exception);
    }
}
