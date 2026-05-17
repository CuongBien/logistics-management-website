using Logistics.Core;

namespace Ordering.Domain.ValueObjects;

public class Consignee : ValueObject
{
    public string FullName { get; private set; }
    public string Phone { get; private set; }
    public Address Address { get; private set; }
    public string? PartnerId { get; private set; } // Liên kết tới MasterData Partner
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }

    public Consignee(string fullName, string phone, Address address, string? partnerId = null, double? latitude = null, double? longitude = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(fullName);
        ArgumentException.ThrowIfNullOrEmpty(phone);
        ArgumentNullException.ThrowIfNull(address);

        FullName = fullName;
        Phone = phone;
        Address = address;
        PartnerId = partnerId;
        Latitude = latitude;
        Longitude = longitude;
    }

    // EF Core
    private Consignee() 
    { 
        FullName = default!;
        Phone = default!;
        Address = default!;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return FullName;
        yield return Phone;
        yield return Address;
        if (Latitude.HasValue) yield return Latitude.Value;
        if (Longitude.HasValue) yield return Longitude.Value;
    }
}
