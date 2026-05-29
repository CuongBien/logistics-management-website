using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetInventoryStats;

public record GetInventoryStatsQuery() : IRequest<Result<InventoryStatsDto>>;

public record InventoryStatsDto(
    int TotalUniqueSkus,
    int TotalPhysicalQuantity
);
