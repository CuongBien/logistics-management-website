namespace EventBus.Messages.Events;

public record NewPartnerEncounteredIntegrationEvent : IntegrationEvent
{
    public NewPartnerEncounteredIntegrationEvent() : base(Guid.NewGuid(), DateTime.UtcNow) { }

    public string TenantId { get; init; } = default!;
    public string Name { get; init; } = default!;
    public string Phone { get; init; } = default!;
    public string? Address { get; init; }
    public string? City { get; init; }
    public string? PartnerId { get; init; }
    public double? Latitude { get; init; }
    public double? Longitude { get; init; }
}
