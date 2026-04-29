namespace Warehouse.Api.Controllers.Requests;

public class ReceiveInboundItemRequest 
{
    public Guid OrderId { get; init; }
    public string BinCode { get; init; }
    public string ScannedBy { get; init; }
}