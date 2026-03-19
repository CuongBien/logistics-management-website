using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Ordering.Api.Hubs;

[Authorize]
public class OrderHub : Hub
{
    // The Hub simply pushes messages to clients.
    // We map Context.UserIdentifier to connection via DI (default behavior uses ClaimTypes.NameIdentifier).
    
    public override async Task OnConnectedAsync()
    {
        var logger = Context.GetHttpContext()?.RequestServices.GetRequiredService<ILogger<OrderHub>>();
        logger?.LogInformation("SignalR Client Connected! UserIdentifier: {UserIdentifier}, ConnectionId: {ConnectionId}", 
            Context.UserIdentifier, Context.ConnectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Optional: log disconnection
        await base.OnDisconnectedAsync(exception);
    }
}
