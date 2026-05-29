using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Dashboard.Queries.GetPendingWorkloads;

public record GetPendingWorkloadsQuery() : IRequest<Result<PendingWorkloadsDto>>;

public record PendingWorkloadsDto(
    int PendingInboundReceipts,
    int PendingPutawayTasks,
    int PendingOutboundWaves,
    int PendingCrossDockTasks
);
