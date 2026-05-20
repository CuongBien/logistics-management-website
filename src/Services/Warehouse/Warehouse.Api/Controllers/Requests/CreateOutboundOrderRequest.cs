namespace Warehouse.Api.Controllers.Requests;

public sealed class CreateOutboundOrderRequest
{
    public Guid OrderId { get; init; }

    public Guid DestinationWarehouseId { get; init; }

    public List<CreateOutboundOrderLineRequest> Lines { get; init; } = new();
}

public sealed class CreateOutboundOrderLineRequest
{
    public string SkuCode { get; init; } = string.Empty;

    public int RequestedQty { get; init; }

    public string? Uom { get; init; }
}
