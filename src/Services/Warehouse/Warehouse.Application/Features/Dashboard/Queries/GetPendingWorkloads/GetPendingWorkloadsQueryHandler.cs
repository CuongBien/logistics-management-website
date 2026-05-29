using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Dashboard.Queries.GetPendingWorkloads;

public class GetPendingWorkloadsQueryHandler : IRequestHandler<GetPendingWorkloadsQuery, Result<PendingWorkloadsDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPendingWorkloadsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PendingWorkloadsDto>> Handle(GetPendingWorkloadsQuery request, CancellationToken cancellationToken)
    {
        // Receipts: Not Completed
        var pendingReceipts = await _context.InboundReceipts
            .AsNoTracking()
            .CountAsync(r => r.Status != InboundReceiptStatus.Received && r.Status != InboundReceiptStatus.CompletedWithExceptions, cancellationToken);

        // Putaway: Not Completed
        var pendingPutaways = await _context.PutawayTasks
            .AsNoTracking()
            .CountAsync(p => p.Status != PutawayTaskStatus.Completed, cancellationToken);

        // We don't have OutboundWaves currently. We will count OutboundOrders that are not Dispatched/Completed.
        var pendingWaves = await _context.OutboundOrders
            .AsNoTracking()
            .CountAsync(o => o.Status != OutboundOrderStatus.Shipped && o.Status != OutboundOrderStatus.Delivered, cancellationToken);

        // CrossDock: Pending or Processing
        var pendingCrossDocks = await _context.CrossDockTasks
            .AsNoTracking()
            .CountAsync(c => c.Status == CrossDockTaskStatus.Pending || c.Status == CrossDockTaskStatus.InProgress, cancellationToken);

        var dto = new PendingWorkloadsDto(
            pendingReceipts,
            pendingPutaways,
            pendingWaves,
            pendingCrossDocks
        );

        return Result<PendingWorkloadsDto>.Success(dto);
    }
}
