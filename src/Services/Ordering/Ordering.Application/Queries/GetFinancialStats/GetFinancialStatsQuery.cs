using Logistics.Core;
using MediatR;

namespace Ordering.Application.Queries.GetFinancialStats;

// Role-based / Tenant Isolated
public record GetFinancialStatsQuery(string? TenantId = null) : IRequest<Result<FinancialStatsDto>>;

public record FinancialStatsDto(
    decimal TotalCodExpected,
    decimal TotalShippingRevenue
);
