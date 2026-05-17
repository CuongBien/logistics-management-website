using Logistics.Core;

namespace MasterData.Domain.Entities;

public class ConsolidationRule : Entity<Guid>, IAggregateRoot
{
    public string RuleCode { get; private set; } = default!;
    public string TransportMode { get; private set; } = default!; // e.g. "Motorbike", "Truck_1_5T", "Truck_8T", "Container"
    public double MaxRadiusKm { get; private set; }
    public decimal MaxWeightKg { get; private set; }
    public decimal MaxVolumeCBM { get; private set; }
    public bool SlaMatchRequired { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private ConsolidationRule() { }

    public ConsolidationRule(
        string ruleCode,
        string transportMode,
        double maxRadiusKm,
        decimal maxWeightKg,
        decimal maxVolumeCbm,
        bool slaMatchRequired = true)
    {
        Id = Guid.NewGuid();
        RuleCode = ruleCode;
        TransportMode = transportMode;
        MaxRadiusKm = maxRadiusKm;
        MaxWeightKg = maxWeightKg;
        MaxVolumeCBM = maxVolumeCbm;
        SlaMatchRequired = slaMatchRequired;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateRule(
        double maxRadiusKm,
        decimal maxWeightKg,
        decimal maxVolumeCbm,
        bool slaMatchRequired,
        bool isActive)
    {
        MaxRadiusKm = maxRadiusKm;
        MaxWeightKg = maxWeightKg;
        MaxVolumeCBM = maxVolumeCbm;
        SlaMatchRequired = slaMatchRequired;
        IsActive = isActive;
    }
}
