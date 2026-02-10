using MediatR;
using OMS.Application.Common.Interfaces;
using OMS.Domain.Entities;
using OMS.Domain.ValueObjects;

namespace OMS.Application.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Guid>
{
    private readonly IApplicationDbContext _context;

    public CreateOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var address = new Address(
            request.ShippingAddress.Street,
            request.ShippingAddress.City,
            request.ShippingAddress.State,
            request.ShippingAddress.Country,
            request.ShippingAddress.ZipCode);

        var order = Order.Create(request.CustomerId, address);

        _context.Orders.Add(order);

        await _context.SaveChangesAsync(cancellationToken);

        return order.Id;
    }
}
