using Logistics.Core;
using MediatR;
using Ordering.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ordering.Application.Queries.GetOrderById;

// Query Record
public record GetOrderByIdQuery(Guid Id) : IRequest<Result<OrderDto>>;

// Response DTOs
public record OrderDto(
    Guid Id,
    string ConsignorId,
    string WaybillCode,
    string Status,
    ConsigneeDto Consignee,
    decimal CodAmount,
    decimal ShippingFee,
    decimal Weight,
    string? Note,
    DateTime CreatedAt,
    // Tracking
    string? PickupDriverId,
    string? WarehouseId,
    string? DeliveryDriverId,
    string? ProofOfDeliveryUrl,
    int DeliveryAttempts
);

public record ConsigneeDto(string FullName, string Phone, AddressDto Address);
public record AddressDto(string Street, string City, string State, string Country, string ZipCode);

// Handler
public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

        if (order == null)
        {
            return Result<OrderDto>.Failure(new Error("Order.NotFound", $"Order with Id {request.Id} was not found."));
        }

        var dto = new OrderDto(
            order.Id,
            order.ConsignorId,
            order.WaybillCode,
            order.Status.ToString(),
            new ConsigneeDto(
                order.Consignee.FullName,
                order.Consignee.Phone,
                new AddressDto(
                    order.Consignee.Address.Street,
                    order.Consignee.Address.City,
                    order.Consignee.Address.State,
                    order.Consignee.Address.Country,
                    order.Consignee.Address.ZipCode)),
            order.CodAmount,
            order.ShippingFee,
            order.Weight,
            order.Note,
            order.CreatedAt,
            order.PickupDriverId,
            order.WarehouseId,
            order.DeliveryDriverId,
            order.ProofOfDeliveryUrl,
            order.DeliveryAttempts
        );

        return Result<OrderDto>.Success(dto);
    }
}
