using MediatR;
using OMS.Domain.ValueObjects;

namespace OMS.Application.Commands.CreateOrder;

public record CreateOrderCommand(string CustomerId, AddressDto ShippingAddress) : IRequest<Guid>;

public record AddressDto(string Street, string City, string State, string Country, string ZipCode);
