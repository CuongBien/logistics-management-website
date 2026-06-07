using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetDiscrepanciesStats;

public record GetDiscrepanciesStatsQuery(Guid? WarehouseId = null) : IRequest<Result<DiscrepanciesStatsDto>>;

public record DiscrepanciesStatsDto(
    int UnresolvedInboundDiscrepancies,
    int UnresolvedTransitDiscrepancies
);
