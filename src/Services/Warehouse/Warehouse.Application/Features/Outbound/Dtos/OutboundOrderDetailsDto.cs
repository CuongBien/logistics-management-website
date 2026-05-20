namespace Warehouse.Application.Features.Outbound.Dtos;

public sealed record OutboundOrderDetailsDto(
    Guid Id,
    Guid OrderId,
    string TenantId,
    string CustomerId,
    Guid DestinationWarehouseId,
    string Status,
    IReadOnlyList<OutboundOrderLineDto> Lines);

public sealed record OutboundOrderLineDto(Guid Id, string SkuCode, int RequestedQty, string Uom);
