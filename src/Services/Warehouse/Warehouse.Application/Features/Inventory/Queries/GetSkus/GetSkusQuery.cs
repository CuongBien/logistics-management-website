using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Queries.GetSkus;

public record GetSkusQuery(string? TenantId) : IRequest<List<SkuDto>>;

public record SkuDto(
    Guid Id,
    string TenantId,
    string SkuCode,
    string Name,
    string UnitOfMeasure,
    string Status,
    DateTime CreatedAt
);

public class GetSkusQueryHandler : IRequestHandler<GetSkusQuery, List<SkuDto>>
{
    private readonly IApplicationDbContext _context;

    public GetSkusQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<SkuDto>> Handle(GetSkusQuery request, CancellationToken cancellationToken)
    {
        var query = _context.ErpSkuMirrors.AsQueryable();

        if (!string.IsNullOrEmpty(request.TenantId))
        {
            query = query.Where(i => i.TenantId == request.TenantId || i.TenantId == "default-tenant");
        }

        var items = await query.ToListAsync(cancellationToken);

        // Deduplicate by SkuCode (case-insensitive), favoring the request.TenantId if there's a duplicate
        var deduplicated = items
            .GroupBy(i => i.SkuCode.ToUpperInvariant())
            .Select(g => g.OrderByDescending(i => i.TenantId == request.TenantId).First())
            .ToList();

        return deduplicated.Select(i => new SkuDto(
            i.Id,
            i.TenantId,
            i.SkuCode,
            i.Name,
            i.UnitOfMeasure,
            i.Status,
            i.SyncedAt
        )).ToList();
    }
}
