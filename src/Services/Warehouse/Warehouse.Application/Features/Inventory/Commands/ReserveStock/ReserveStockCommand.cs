using Logistics.Core;
using MediatR;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Commands.ReserveStock;

public class ReserveStockCommand : IRequest<Result<Guid>>
{
    public Guid WarehouseId { get; init; }
    public string Sku { get; init; } = string.Empty;
    public int Quantity { get; init; }
    public string ReferenceId { get; init; } = string.Empty;
    public ReservationType ReferenceType { get; init; }
    public string? TenantId { get; set; }
    public string? OperatorSub { get; set; }
    public string? CorrelationId { get; init; }
}
