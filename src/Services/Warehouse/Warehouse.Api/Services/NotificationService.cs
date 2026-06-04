using Microsoft.AspNetCore.SignalR;
using Warehouse.Api.Hubs;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Api.Services;

public class NotificationService : INotificationService
{
    private readonly IApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        IApplicationDbContext context, 
        IHubContext<NotificationHub> hubContext,
        ILogger<NotificationService> logger)
    {
        _context = context;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task NotifyAsync(
        string title, 
        string message, 
        NotificationType type, 
        NotificationCategory category, 
        Guid? warehouseId = null, 
        string? targetUserId = null, 
        string? targetRole = null,
        CancellationToken cancellationToken = default)
    {
        var notification = Notification.Create(title, message, type, category, warehouseId, targetUserId, targetRole);
        
        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = new
        {
            Id = notification.Id,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type.ToString().ToLower(),
            Category = notification.Category.ToString(),
            CreatedAt = notification.CreatedAt,
            IsRead = notification.IsRead
        };

        try
        {
            if (!string.IsNullOrEmpty(targetUserId))
            {
                await _hubContext.Clients.User(targetUserId).SendAsync("ReceiveNotification", dto, cancellationToken);
            }
            else if (!string.IsNullOrEmpty(targetRole))
            {
                await _hubContext.Clients.Group($"Role_{targetRole}").SendAsync("ReceiveNotification", dto, cancellationToken);
            }
            else if (warehouseId.HasValue)
            {
                await _hubContext.Clients.Group($"Warehouse_{warehouseId.Value}").SendAsync("ReceiveNotification", dto, cancellationToken);
            }
            else
            {
                await _hubContext.Clients.All.SendAsync("ReceiveNotification", dto, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SignalR notification");
        }
    }
}
