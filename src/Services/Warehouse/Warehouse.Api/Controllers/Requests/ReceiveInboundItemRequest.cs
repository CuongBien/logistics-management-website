namespace Warehouse.Api.Controllers.Requests;

public class ReceiveInboundItemRequest 
{
    public Guid OrderId { get; init; }
    public required string TenantId { get; init; }
    public required string SkuCode { get; init; }
    public required string BinCode { get; init; }
    public required string ScannedBy { get; init; }
}