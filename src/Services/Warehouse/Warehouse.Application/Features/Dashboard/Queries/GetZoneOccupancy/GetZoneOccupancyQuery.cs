using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetZoneOccupancy;

public record GetZoneOccupancyQuery(Guid WarehouseId) : IRequest<Result<List<ZoneOccupancyDto>>>;

public record ZoneOccupancyDto(
    string Id,
    string Name,
    int OrdersActive,
    int WorkersAssigned,
    int Capacity,
    int Alerts
);
