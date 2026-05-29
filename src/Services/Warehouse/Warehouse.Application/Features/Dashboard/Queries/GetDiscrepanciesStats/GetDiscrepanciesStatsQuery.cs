using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetDiscrepanciesStats;

public record GetDiscrepanciesStatsQuery() : IRequest<Result<DiscrepanciesStatsDto>>;

public record DiscrepanciesStatsDto(
    int UnresolvedInboundDiscrepancies,
    int UnresolvedTransitDiscrepancies
);
