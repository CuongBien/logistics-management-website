using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Outbound.Queries.GetReturnsList;

public record OutboundReturnDto(
    string Id, 
    string OrderNo, 
    string Sku, 
    int ReturnedQty, 
    string Condition, 
    string Disposition, 
    DateTime CreatedAt, 
    string? Notes);

public record GetReturnsListQuery(Guid WarehouseId) : IRequest<Result<List<OutboundReturnDto>>>;

public sealed class GetReturnsListQueryHandler : IRequestHandler<GetReturnsListQuery, Result<List<OutboundReturnDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetReturnsListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OutboundReturnDto>>> Handle(GetReturnsListQuery request, CancellationToken cancellationToken)
    {
        var returns = await _context.OutboundReturns
            .Where(r => r.WarehouseId == request.WarehouseId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = returns.Select(r => new OutboundReturnDto(
            r.Id.ToString(),
            r.OrderNo,
            r.Sku,
            r.ReturnedQty,
            r.Condition.ToString(),
            r.Disposition.ToString(),
            r.CreatedAt,
            r.Notes
        )).ToList();

        return Result<List<OutboundReturnDto>>.Success(dtos);
    }
}
