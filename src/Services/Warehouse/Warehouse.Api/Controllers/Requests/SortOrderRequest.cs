namespace Warehouse.Api.Controllers.Requests;

public sealed class SortOrderRequest
{
    public Guid OrderId { get; init; }
    public Guid? DestinationWarehouseId { get; init; }
    public string? SourceShipmentNo { get; init; }
}
