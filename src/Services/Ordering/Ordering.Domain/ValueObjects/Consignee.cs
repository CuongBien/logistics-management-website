using Logistics.Core;

namespace Ordering.Domain.ValueObjects;

public class Consignee : ValueObject
{
    public string FullName { get; private set; }
    public string Phone { get; private set; }
    public Address Address { get; private set; }
    public string? PartnerId { get; private set; } // Liên kết tới MasterData Partner

    public Consignee(string fullName, string phone, Address address, string? partnerId = null)
    {
        ArgumentException.ThrowIfNullOrEmpty(fullName);
        ArgumentException.ThrowIfNullOrEmpty(phone);
        ArgumentNullException.ThrowIfNull(address);

        FullName = fullName;
        Phone = phone;
        Address = address;
        PartnerId = partnerId;
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
    }
}
