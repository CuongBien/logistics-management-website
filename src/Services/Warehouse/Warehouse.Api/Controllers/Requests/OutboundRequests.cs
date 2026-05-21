using Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;

namespace Warehouse.Api.Controllers.Requests;

public class CreateOutboundOrderRequest
{
    public Guid WarehouseId { get; set; }
    public Guid OrderId { get; set; }
    public string CustomerId { get; set; } = default!;
    public string OrderNo { get; set; } = default!;
    public string? DestinationAddress { get; set; }
    public string? DestinationCity { get; set; }
    public int Priority { get; set; }
    public bool AllowPartial { get; set; } = true;
    public DateTime? PlannedShipAt { get; set; }
    public List<OutboundOrderLineItem> Lines { get; set; } = new();
    public string? PartnerId { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Volume { get; set; }
}

public class ShipOrderRequest
{
    public Guid? ShipmentId { get; set; }
}

public class PickOrderRequest
{
    public string? WaveId { get; set; }
}
