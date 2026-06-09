using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum NotificationType
{
    Info = 1,
    Success = 2,
    Warning = 3,
    Error = 4
}

public enum NotificationCategory
{
    InboundCreated = 1,
    PutawayCompleted = 2,
    HighPriorityOutbound = 3,
    WavePickedReadyForDispatch = 4,
    ShortPick = 5,
    LowStock = 6,
    RtoReceived = 7,
    IntegrationFailure = 8,
    ShortReplenish = 9
}

public class Notification : Entity<Guid>, IAggregateRoot
{
    public string Title { get; private set; } = default!;
    public string Message { get; private set; } = default!;
    public NotificationType Type { get; private set; }
    public NotificationCategory Category { get; private set; }
    public bool IsRead { get; private set; }
    
    // Target recipients. If both null, it's a global notification.
    public string? TargetUserId { get; private set; }
    public string? TargetRole { get; private set; }
    public Guid? WarehouseId { get; private set; }
    
    public DateTime CreatedAt { get; private set; }

    private Notification() { }

    public Notification(
        string title, 
        string message, 
        NotificationType type, 
        NotificationCategory category, 
        Guid? warehouseId = null,
        string? targetUserId = null,
        string? targetRole = null)
    {
        Id = Guid.NewGuid();
        Title = title;
        Message = message;
        Type = type;
        Category = category;
        WarehouseId = warehouseId;
        TargetUserId = targetUserId;
        TargetRole = targetRole;
        IsRead = false;
        CreatedAt = DateTime.UtcNow;
    }

    public static Notification Create(
        string title, 
        string message, 
        NotificationType type, 
        NotificationCategory category, 
        Guid? warehouseId = null,
        string? targetUserId = null,
        string? targetRole = null)
    {
        return new Notification(title, message, type, category, warehouseId, targetUserId, targetRole);
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}
