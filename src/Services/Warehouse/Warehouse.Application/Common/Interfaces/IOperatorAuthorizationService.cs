namespace Warehouse.Application.Common.Interfaces;

public interface IOperatorAuthorizationService
{
    Task<bool> HasPermissionAsync(string operatorSub, Guid warehouseId, Guid? zoneId, string permissionCode, CancellationToken cancellationToken = default);
}
