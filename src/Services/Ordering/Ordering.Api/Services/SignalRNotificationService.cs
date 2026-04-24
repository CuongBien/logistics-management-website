using Microsoft.AspNetCore.SignalR;
using Ordering.Application.Common.Interfaces;
using Ordering.Api.Hubs;
using Microsoft.Extensions.Logging;

namespace Ordering.Api.Services;

public class SignalRNotificationService : INotificationService
{
    private readonly IHubContext<OrderHub> _hubContext;
    private readonly ILogger<SignalRNotificationService> _logger;
    private readonly Dictionary<string, DateTime> _lastNotificationTimes = new();
    private readonly object _lock = new();

    public SignalRNotificationService(IHubContext<OrderHub> hubContext, ILogger<SignalRNotificationService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendOrderStatusUpdatedAsync(string userId, Guid orderId, string status, string message, CancellationToken cancellationToken)
    {
        var key = $"{userId}:{orderId}:{status}";
        
        lock (_lock)
        {
            var now = DateTime.UtcNow;
            if (_lastNotificationTimes.TryGetValue(key, out var lastTime) && (now - lastTime).TotalSeconds < 5)
            {
                _logger.LogDebug("Skipping duplicate notification for {Key}", key);
                return;
            }
            _lastNotificationTimes[key] = now;
            
            if (_lastNotificationTimes.Count > 1000)
            {
                var oldKeys = _lastNotificationTimes.Where(x => (now - x.Value).TotalMinutes > 5).Select(x => x.Key).ToList();
                foreach (var oldKey in oldKeys)
                    _lastNotificationTimes.Remove(oldKey);
            }
        }
        
        _logger.LogInformation("SignalR pushing OrderStatusUpdated to {UserId} for Order {OrderId}", userId, orderId);
        
        await _hubContext.Clients.User(userId).SendAsync("OrderStatusUpdated", new 
        {
            OrderId = orderId,
            Status = status,
            Message = message
        }, cancellationToken);
    }
}
