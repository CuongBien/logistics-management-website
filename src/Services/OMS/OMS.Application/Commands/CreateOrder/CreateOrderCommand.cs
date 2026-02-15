using BuildingBlocks.Domain;
using MediatR;
using OMS.Domain.ValueObjects;

namespace OMS.Application.Commands.CreateOrder;

public record CreateOrderCommand(string CustomerId, AddressDto ShippingAddress, List<OrderItemDto> Items) : IRequest<Result<Guid>>;

public record AddressDto(string Street, string City, string State, string Country, string ZipCode);

public record OrderItemDto(string ProductId, int Quantity, decimal UnitPrice, string Currency);
