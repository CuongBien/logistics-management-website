public record ReceiveInboundItemCommand : IRequest
{
    public Guid ReceiptId { get; init; }
    public Guid OrderId { get; init; }
    public string BinCode { get; init; }
    public string ScannedBy { get; init; }
    public sealed record ReceiveInboundItemCommand(
       Guid ReceiptId,
       Guid OrderId,
       string BinCode,
       string ScannedBy
    ) : IRequest;
}