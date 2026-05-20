using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Entities;
using Ordering.Domain.ValueObjects;

namespace Ordering.Application.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var activeSkuCodes = await _context.ErpSkuMirrors
            .Where(x => x.TenantId == request.TenantId && x.Status == "active")
            .Select(x => x.SkuCode)
            .ToListAsync(cancellationToken);
        var missingSkuCodes = request.SkuCodes.Except(activeSkuCodes).ToArray();

        if (missingSkuCodes.Length > 0)
        {
            return Result<Guid>.Failure(new Error(
                "ErpSkuMirror.MissingMapping",
                $"Cannot create order because SKU mappings are missing for tenant '{request.TenantId}': {string.Join(", ", missingSkuCodes)}"));
        }

        // 1. Build Consignee Value Object
        var address = new Address(
            request.Consignee.Address.Street,
            request.Consignee.Address.City,
            request.Consignee.Address.State,
            request.Consignee.Address.Country,
            request.Consignee.Address.ZipCode);

        var consignee = new Consignee(
            request.Consignee.FullName,
            request.Consignee.Phone,
            address);

        // 2. Create Order Aggregate (auto-generates WaybillCode)
        var orderResult = Order.Create(
            request.TenantId,
            request.ConsignorId,
            consignee,
            request.CodAmount,
            request.ShippingFee,
            request.Weight,
            request.Note);

        if (orderResult.IsFailure)
        {
            return Result<Guid>.Failure(orderResult.Error);
        }

        var order = orderResult.Value!;

        // 3. Auto-confirm (validate → AwaitingPickup)
        var confirmResult = order.Confirm();
        if (confirmResult.IsFailure)
        {
            return Result<Guid>.Failure(confirmResult.Error);
        }

        // 4. Persist
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(order.Id);
    }
}
