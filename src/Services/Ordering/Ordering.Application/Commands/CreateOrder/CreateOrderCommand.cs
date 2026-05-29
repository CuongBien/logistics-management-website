using Logistics.Core;
using MediatR;

namespace Ordering.Application.Commands.CreateOrder;

public record CreateOrderCommand(
    IReadOnlyCollection<string> SkuCodes,
    ConsigneeDto Consignee, 
    decimal CodAmount,
    decimal ShippingFee,
    decimal Weight,
    string? Note,
    bool SaveToContacts = false,
    int FulfillmentMode = 1,
    int OrderType = 1,
    string TenantId = "",
    string ConsignorId = "",
    string? SourceWarehouseCode = null,
    ConsignorDto? Consignor = null) : IRequest<Result<Guid>>;

public record ConsigneeDto(string? FullName, string? Phone, AddressDto? Address, string? PartnerId = null, double? Latitude = null, double? Longitude = null);

public record AddressDto(string? Street, string? City, string? State, string? Country, string? ZipCode);

public record ConsignorDto(string? FullName, string? Phone, AddressDto? Address);

