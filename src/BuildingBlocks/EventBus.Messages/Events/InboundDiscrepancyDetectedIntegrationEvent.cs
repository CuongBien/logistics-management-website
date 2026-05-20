namespace EventBus.Messages.Events;

public record InboundDiscrepancyDetectedIntegrationEvent(
    Guid OrderId,
    string WarehouseId,
    List<DiscrepancyLineItem> Lines
) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);

public record DiscrepancyLineItem(
    string SkuCode,
    int ExpectedQty,
    int ReceivedQty,
    int RejectedQty,
    int ShortageQty,
    string? RejectionReason
);
