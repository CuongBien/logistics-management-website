namespace EventBus.Messages.Events;

public record OrderExceptionResolvedIntegrationEvent(
    Guid OrderId,
    string Strategy
) : IntegrationEvent(Guid.NewGuid(), DateTime.UtcNow);
