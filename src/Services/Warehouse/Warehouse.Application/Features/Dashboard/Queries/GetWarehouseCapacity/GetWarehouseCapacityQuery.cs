using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetWarehouseCapacity;

public record GetWarehouseCapacityQuery(Guid? WarehouseId = null) : IRequest<Result<WarehouseCapacityDto>>;

public record WarehouseCapacityDto(
    int TotalBins,
    int EmptyBins,
    int OccupiedBins,
    int FullBins,
    double OccupancyRate
);
