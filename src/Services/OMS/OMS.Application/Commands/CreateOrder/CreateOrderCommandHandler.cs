using BuildingBlocks.Domain;
using MediatR;
using OMS.Application.Common.Interfaces;
using OMS.Domain.Entities;
using OMS.Domain.ValueObjects;

namespace OMS.Application.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var address = new Address(
            request.ShippingAddress.Street,
            request.ShippingAddress.City,
            request.ShippingAddress.State,
            request.ShippingAddress.Country,
            request.ShippingAddress.ZipCode);

        // 1. Create Order Aggregate
        var orderResult = Order.Create(request.CustomerId, address);

        if (orderResult.IsFailure)
        {
            return Result<Guid>.Failure(orderResult.Error);
        }

        var order = orderResult.Value;

        // 2. Add Items
        foreach (var itemDto in request.Items)
        {
            order.AddItem(
                itemDto.ProductId, 
                itemDto.Quantity, 
                new Money(itemDto.UnitPrice, itemDto.Currency));
        }

        // 3. Persist
        _context.Orders.Add(order);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(order.Id);
    }
}
