using BuildingBlocks.Domain;
using MediatR;
using OMS.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using OMS.Domain.Entities;
using OMS.Domain.Enums;

namespace OMS.Application.Queries.GetOrderById;

// Query Record
public record GetOrderByIdQuery(Guid Id) : IRequest<Result<OrderDto>>;

// Response DTOs
public record OrderDto(
    Guid Id,
    string CustomerId,
    string Status,
    AddressDto ShippingAddress,
    DateTime CreatedAt,
    List<OrderItemDto> Items,
    decimal TotalAmount
);

public record AddressDto(string Street, string City, string State, string Country, string ZipCode);

public record OrderItemDto(string ProductId, int Quantity, decimal UnitPrice, string Currency, decimal TotalPrice);


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
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

        if (order == null)
        {
            // Ideally use DomainErrors.Order.NotFound but we need to reference Domain layer or return string error
            return Result<OrderDto>.Failure(new Error("Order.NotFound", $"Order with Id {request.Id} was not found."));
        }

        var dto = new OrderDto(
            order.Id,
            order.CustomerId,
            order.Status.ToString(),
            new AddressDto(
                order.ShippingAddress.Street,
                order.ShippingAddress.City,
                order.ShippingAddress.State,
                order.ShippingAddress.Country,
                order.ShippingAddress.ZipCode),
            order.CreatedAt,
            order.Items.Select(i => new OrderItemDto(
                i.ProductId,
                i.Quantity,
                i.UnitPrice.Amount,
                i.UnitPrice.Currency,
                i.Quantity * i.UnitPrice.Amount
            )).ToList(),
            order.TotalAmount
        );

        return Result<OrderDto>.Success(dto);
    }
}
