using BuildingBlocks.Domain;
using MediatR;

namespace OMS.Application.Commands.CreateOrder;

public record CreateOrderCommand(
    string ConsignorId, 
    ConsigneeDto Consignee, 
    decimal CodAmount,
    decimal ShippingFee,
    decimal Weight,
    string? Note = null) : IRequest<Result<Guid>>;

public record ConsigneeDto(string FullName, string Phone, AddressDto Address);

public record AddressDto(string Street, string City, string State, string Country, string ZipCode);
