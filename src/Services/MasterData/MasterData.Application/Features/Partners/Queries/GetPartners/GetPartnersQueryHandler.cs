using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MasterData.Application.Common.Interfaces;

namespace MasterData.Application.Features.Partners.Queries.GetPartners;

public class GetPartnersQueryHandler : IRequestHandler<GetPartnersQuery, Result<PaginatedList<PartnerDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetPartnersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PaginatedList<PartnerDto>>> Handle(GetPartnersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Partners.AsNoTracking().Where(p => p.TenantId == request.TenantId);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(x => 
                x.Code.ToLower().Contains(term) ||
                x.Name.ToLower().Contains(term) ||
                (x.Phone != null && x.Phone.Contains(term))
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new PartnerDto(
                x.Id,
                x.Code,
                x.Name,
                x.Type.ToString(),
                x.Phone,
                x.Email,
                x.Address,
                x.City,
                x.District,
                x.Latitude,
                x.Longitude,
                x.IsActive,
                x.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        var result = new PaginatedList<PartnerDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PaginatedList<PartnerDto>>.Success(result);
    }
}
