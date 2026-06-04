using Warehouse.Domain.Entities;

namespace Warehouse.Application.Common.Interfaces;

public interface INotificationService
{
    Task NotifyAsync(
        string title, 
        string message, 
        NotificationType type, 
        NotificationCategory category, 
        Guid? warehouseId = null, 
        string? targetUserId = null, 
        string? targetRole = null,
        CancellationToken cancellationToken = default);
}
