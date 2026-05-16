using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;

public record OutboundOrderLineItem(string Sku, int Quantity, string Uom);

public record CreateOutboundOrderCommand(
    string TenantId,
    string CustomerId,
    Guid WarehouseId,
    Guid OrderId,
    string OrderNo,
    string? DestinationAddress,
    string? DestinationCity,
    int Priority,
    bool AllowPartial,
    DateTime? PlannedShipAt,
    List<OutboundOrderLineItem> Lines,
    string? PartnerId = null) : IRequest<Result<Guid>>;
