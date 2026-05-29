using Ordering.Domain.ValueObjects;

namespace Ordering.Domain.Entities;

/// <summary>
/// 1:1 extension row for consignee; dual-written with inline Orders owned-type during normalization.
/// </summary>
public class OrderConsignee
{
    public Guid OrderId { get; private set; }
    public string FullName { get; private set; } = default!;
    public string Phone { get; private set; } = default!;
    public string Street { get; private set; } = default!;
    public string City { get; private set; } = default!;
    public string State { get; private set; } = default!;
    public string Country { get; private set; } = default!;
    public string ZipCode { get; private set; } = default!;
    public double? Latitude { get; private set; }
    public double? Longitude { get; private set; }
    public DateTime CreatedAt { get; private set; }

    // EF Core
    private OrderConsignee()
    {
    }

    public OrderConsignee(Guid orderId, Consignee source)
    {
        ArgumentNullException.ThrowIfNull(source);
        ArgumentNullException.ThrowIfNull(source.Address);

        OrderId = orderId;
        FullName = source.FullName;
        Phone = source.Phone;
        Street = source.Address.Street;
        City = source.Address.City;
        State = source.Address.State;
        Country = source.Address.Country;
        ZipCode = source.Address.ZipCode;
        Latitude = source.Latitude;
        Longitude = source.Longitude;
        CreatedAt = DateTime.UtcNow;
    }
}
