using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inventory.Commands.ReleaseStock;

public class ReleaseStockCommand : IRequest<Result<bool>>
{
    public Guid WarehouseId { get; init; }
    public Guid ReservationId { get; init; }
    public string? OperatorSub { get; set; }
}
