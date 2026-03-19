namespace EventBus.Messages.Events;

public record IntegrationEvent(Guid Id, DateTime OccurredOn);
