using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;

public record OutboundOrderLineSpec(string SkuCode, int RequestedQty, string? Uom);

public record CreateOutboundOrderCommand(
    Guid OrderId,
    Guid DestinationWarehouseId,
    string TenantId,
    string CustomerId,
    IReadOnlyList<OutboundOrderLineSpec> Lines) : IRequest<Result<Guid>>;
