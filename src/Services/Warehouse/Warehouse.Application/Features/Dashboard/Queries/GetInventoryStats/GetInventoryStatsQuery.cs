using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetInventoryStats;

public record GetInventoryStatsQuery(Guid? WarehouseId = null) : IRequest<Result<InventoryStatsDto>>;

public record InventoryStatsDto(
    int TotalUniqueSkus,
    int TotalPhysicalQuantity
);
