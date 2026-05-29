using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Enums;

namespace Ordering.Application.Queries.GetFinancialStats;

public class GetFinancialStatsQueryHandler : IRequestHandler<GetFinancialStatsQuery, Result<FinancialStatsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetFinancialStatsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<FinancialStatsDto>> Handle(GetFinancialStatsQuery request, CancellationToken cancellationToken)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var query = _context.Orders
            .AsNoTracking()
            .Where(o => o.CreatedAt >= thirtyDaysAgo && o.Status != OrderStatus.Cancelled);

        if (!string.IsNullOrWhiteSpace(request.TenantId))
        {
            query = query.Where(o => o.TenantId == request.TenantId);
        }

        var financials = await query
            .Select(o => new { o.CodAmount, o.ShippingFee })
            .ToListAsync(cancellationToken);

        decimal totalCod = financials.Sum(x => x.CodAmount);
        decimal totalShipping = financials.Sum(x => x.ShippingFee);

        var dto = new FinancialStatsDto(totalCod, totalShipping);

        return Result<FinancialStatsDto>.Success(dto);
    }
}
