public record ShipmentReceivedIntegrationEvent(
    required Guid ReceiptId,
    required Guid OrderId,
    required string BinCode,
    required DateTime ReceivedAt
) : IIntegrationEvent;