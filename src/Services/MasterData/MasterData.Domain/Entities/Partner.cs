using Logistics.Core;
using MasterData.Domain.Enums;

namespace MasterData.Domain.Entities;

public class Partner : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string Code { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public PartnerType Type { get; private set; }
    
    // Contact Info
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    
    // Address Info
    public string? Address { get; private set; }
    public string? City { get; private set; }
    public string? District { get; private set; }
    
    // GPS Coordinates
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }
    
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Partner() { }

    public Partner(
        string tenantId,
        string code,
        string name,
        PartnerType type,
        string? phone = null,
        string? address = null,
        string? city = null,
        double? latitude = null,
        double? longitude = null)
    {
        Id = Guid.NewGuid();
        TenantId = tenantId;
        Code = code;
        Name = name;
        Type = type;
        Phone = phone;
        Address = address;
        City = city;
        Latitude = latitude;
        Longitude = longitude;
        IsActive = true;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateInfo(string name, string? phone, string? address, string? city, double? latitude = null, double? longitude = null)
    {
        Name = name;
        Phone = phone;
        Address = address;
        City = city;
        Latitude = latitude;
        Longitude = longitude;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;
}
