using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetPendingWorkloads;

public record GetPendingWorkloadsQuery(Guid? WarehouseId = null) : IRequest<Result<PendingWorkloadsDto>>;

public record PendingWorkloadsDto(
    int PendingInboundReceipts,
    int PendingPutawayTasks,
    int PendingOutboundWaves,
    int PendingCrossDockTasks
);
