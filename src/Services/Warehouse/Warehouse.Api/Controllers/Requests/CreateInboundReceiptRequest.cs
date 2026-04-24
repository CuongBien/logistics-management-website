public class CreateInbound ReceiptRequest
{
    public IReadOnlyCollection<Guid> OrderIds { get; init; } = Array.Empty<Guid>();
}