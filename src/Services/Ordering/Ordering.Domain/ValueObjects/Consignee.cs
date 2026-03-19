using Logistics.Core;

namespace Ordering.Domain.ValueObjects;

public class Consignee : ValueObject
{
    public string FullName { get; private set; }
    public string Phone { get; private set; }
    public Address Address { get; private set; }

    public Consignee(string fullName, string phone, Address address)
    {
        ArgumentException.ThrowIfNullOrEmpty(fullName);
        ArgumentException.ThrowIfNullOrEmpty(phone);
        ArgumentNullException.ThrowIfNull(address);

        FullName = fullName;
        Phone = phone;
        Address = address;
    }

    // EF Core
    private Consignee() { }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return FullName;
        yield return Phone;
        yield return Address;
    }
}
