using Microsoft.AspNetCore.SignalR;
using OMS.Application.Common.Interfaces;
using OMS.Api.Hubs;
using Microsoft.Extensions.Logging;

namespace OMS.Api.Services;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<OrderHub> _hubContext;
    private readonly ILogger<SignalRNotificationService> _logger;

    public SignalRNotificationService(IHubContext<OrderHub> hubContext, ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendOrderStatusUpdatedAsync(string userId, Guid orderId, string status, string message, CancellationToken cancellationToken)
    {
        _logger.LogInformation("SignalR pushing OrderStatusUpdated to {UserId} for Order {OrderId}", userId, orderId);
        
        await _hubContext.Clients.User(userId).SendAsync("OrderStatusUpdated", new 
        {
            OrderId = orderId,
            Status = status,
            Message = message
        }, cancellationToken);
    }
}
