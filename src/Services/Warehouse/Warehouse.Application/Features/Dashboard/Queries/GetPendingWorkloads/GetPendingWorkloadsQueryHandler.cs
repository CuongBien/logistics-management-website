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
        var receiptsQuery = _context.InboundReceipts.AsNoTracking().Where(r => r.Status != InboundReceiptStatus.Received && r.Status != InboundReceiptStatus.CompletedWithExceptions);
        if (request.WarehouseId.HasValue) receiptsQuery = receiptsQuery.Where(r => r.WarehouseId == request.WarehouseId.Value);
        var pendingReceipts = await receiptsQuery.CountAsync(cancellationToken);

        // Putaway: Not Completed
        var putawaysQuery = _context.PutawayTasks.AsNoTracking().Where(p => p.Status != PutawayTaskStatus.Completed);
        if (request.WarehouseId.HasValue) putawaysQuery = putawaysQuery.Where(p => p.SourceBin != null && p.SourceBin.WarehouseId == request.WarehouseId.Value);
        var pendingPutaways = await putawaysQuery.CountAsync(cancellationToken);

        // OutboundWaves/Orders
        var wavesQuery = _context.OutboundOrders.AsNoTracking().Where(o => o.Status != OutboundOrderStatus.Shipped && o.Status != OutboundOrderStatus.Delivered);
        if (request.WarehouseId.HasValue) wavesQuery = wavesQuery.Where(o => o.WarehouseId == request.WarehouseId.Value);
        var pendingWaves = await wavesQuery.CountAsync(cancellationToken);

        // CrossDock: Pending or Processing
        var crossDocksQuery = _context.CrossDockTasks.AsNoTracking().Where(c => c.Status == CrossDockTaskStatus.Pending || c.Status == CrossDockTaskStatus.InProgress);
        if (request.WarehouseId.HasValue) crossDocksQuery = crossDocksQuery.Where(c => c.WarehouseId == request.WarehouseId.Value);
        var pendingCrossDocks = await crossDocksQuery.CountAsync(cancellationToken);

        var dto = new PendingWorkloadsDto(
            pendingReceipts,
            pendingPutaways,
            pendingWaves,
            pendingCrossDocks
        );

        return Result<PendingWorkloadsDto>.Success(dto);
    }
}
