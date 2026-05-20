using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;

public class CreateOutboundOrderCommandHandler : IRequestHandler<CreateOutboundOrderCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateOutboundOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateOutboundOrderCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TenantId) || string.IsNullOrWhiteSpace(request.CustomerId))
        {
            return Result<Guid>.Failure(new Error(
                "Outbound.MissingOwnership",
                "TenantId and CustomerId are required."));
        }

        var hasWarehouseScope = await _context.OperatorProfiles
            .Where(x => x.TenantId == request.TenantId && x.OperatorSub == request.CustomerId && x.IsActive)
            .SelectMany(x => x.WarehouseScopes)
            .AnyAsync(x => x.WarehouseId == request.DestinationWarehouseId, cancellationToken);

        if (!hasWarehouseScope)
        {
            return Result<Guid>.Failure(DomainErrors.Outbound.ForbiddenWarehouseScope(
                request.CustomerId,
                request.DestinationWarehouseId));
        }

        var existing = await _context.OutboundOrders
            .FirstOrDefaultAsync(
                o => o.TenantId == request.TenantId && o.OrderId == request.OrderId,
                cancellationToken);

        if (existing is not null)
        {
            return Result<Guid>.Failure(DomainErrors.Outbound.AlreadyExists(request.OrderId));
        }

        try
        {
            var specs = request.Lines
                .Select(l => (l.SkuCode, l.RequestedQty, l.Uom))
                .ToList();

            var order = new OutboundOrder(
                request.OrderId,
                request.DestinationWarehouseId,
                request.TenantId,
                request.CustomerId,
                specs);

            _context.OutboundOrders.Add(order);
            await _context.SaveChangesAsync(cancellationToken);

            return Result<Guid>.Success(order.Id);
        }
        catch (ArgumentException ex)
        {
            return Result<Guid>.Failure(DomainErrors.Outbound.LineInvalid(ex.Message));
        }
    }
}
