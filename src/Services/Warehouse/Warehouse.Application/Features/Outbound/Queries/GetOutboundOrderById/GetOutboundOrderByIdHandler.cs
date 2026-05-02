using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Outbound.Dtos;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Queries.GetOutboundOrderById;

public class GetOutboundOrderByIdHandler : IRequestHandler<GetOutboundOrderByIdQuery, Result<OutboundOrderDetailsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOutboundOrderByIdHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OutboundOrderDetailsDto>> Handle(GetOutboundOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _context.OutboundOrders
            .AsNoTracking()
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(
                o => o.Id == request.Id && o.TenantId == request.TenantId,
                cancellationToken);

        if (entity is null)
        {
            return Result<OutboundOrderDetailsDto>.Failure(DomainErrors.Outbound.NotFound(request.Id));
        }

        var lines = entity.Lines
            .Select(l => new OutboundOrderLineDto(l.Id, l.SkuCode, l.RequestedQty, l.Uom))
            .ToList();

        var dto = new OutboundOrderDetailsDto(
            entity.Id,
            entity.OrderId,
            entity.TenantId,
            entity.CustomerId,
            entity.DestinationWarehouseId,
            entity.Status.ToString(),
            lines);

        return Result<OutboundOrderDetailsDto>.Success(dto);
    }
}
