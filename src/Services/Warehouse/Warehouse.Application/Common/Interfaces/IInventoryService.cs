using Warehouse.Domain.Enums;

namespace Warehouse.Application.Common.Interfaces;

public interface IInventoryService
{
    Task<Guid> ReserveAsync(
        string tenantId,
        Guid warehouseId,
        string sku,
        int quantity,
        string referenceId,
        ReservationType referenceType,
        string? operatorSub = null,
        string? correlationId = null,
        CancellationToken cancellationToken = default);

    Task<bool> ReleaseAsync(Guid reservationId, string? operatorSub = null, CancellationToken cancellationToken = default);
    
    Task<bool> ConsumeAsync(Guid reservationId, string? operatorSub = null, CancellationToken cancellationToken = default);
}
