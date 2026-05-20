using Logistics.Core;
using MediatR;

namespace Ordering.Application.Commands.CreateOrder;

public record CreateOrderCommand(
    string TenantId,
    string ConsignorId, 
    IReadOnlyCollection<string> SkuCodes,
    ConsigneeDto Consignee, 
    decimal CodAmount,
    decimal ShippingFee,
    decimal Weight,
    string? Note) : IRequest<Result<Guid>>;

public record ConsigneeDto(string FullName, string Phone, AddressDto Address);

public record AddressDto(string Street, string City, string State, string Country, string ZipCode);
