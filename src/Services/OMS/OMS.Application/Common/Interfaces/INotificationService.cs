namespace OMS.Application.Common.Interfaces;

public interface INotificationService
{
    Task SendOrderStatusUpdatedAsync(string userId, Guid orderId, string status, string message, CancellationToken cancellationToken);
}
