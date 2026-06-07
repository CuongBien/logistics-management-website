using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Dashboard.Queries.GetOperatorProductivity;

public class GetOperatorProductivityQueryHandler : IRequestHandler<GetOperatorProductivityQuery, Result<List<OperatorProductivityDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOperatorProductivityQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OperatorProductivityDto>>> Handle(GetOperatorProductivityQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        // Inbound Receipts
        var receiptsQuery = _context.InboundReceipts.AsNoTracking().Where(r => r.CreatedByOperatorId != null);
        if (request.WarehouseId.HasValue) receiptsQuery = receiptsQuery.Where(r => r.WarehouseId == request.WarehouseId.Value);
        var receipts = await receiptsQuery.ToListAsync(cancellationToken);

        // Putaway Tasks
        var putawaysQuery = _context.PutawayTasks.AsNoTracking().Include(p => p.SourceBin).Where(p => p.OperatorId != null);
        if (request.WarehouseId.HasValue) putawaysQuery = putawaysQuery.Where(p => p.SourceBin != null && p.SourceBin.WarehouseId == request.WarehouseId.Value);
        var putaways = await putawaysQuery.ToListAsync(cancellationToken);

        // Pick Tasks
        var picksQuery = _context.PickTasks.AsNoTracking().Include(p => p.FromBin).Where(p => p.AssignedOperatorId != null);
        if (request.WarehouseId.HasValue) picksQuery = picksQuery.Where(p => p.FromBin != null && p.FromBin.WarehouseId == request.WarehouseId.Value);
        var picks = await picksQuery.ToListAsync(cancellationToken);

        // Replenishment Tasks
        var replenishmentsQuery = _context.ReplenishmentTasks.AsNoTracking().Where(r => r.AssignedTo != null);
        if (request.WarehouseId.HasValue) replenishmentsQuery = replenishmentsQuery.Where(r => r.WarehouseId == request.WarehouseId.Value);
        var replenishments = await replenishmentsQuery.ToListAsync(cancellationToken);

        // Count Tasks
        var countsQuery = _context.CountTasks.AsNoTracking().Where(c => c.AssignedTo != null);
        if (request.WarehouseId.HasValue) countsQuery = countsQuery.Where(c => c.WarehouseId == request.WarehouseId.Value);
        var counts = await countsQuery.ToListAsync(cancellationToken);
            
        // Aggregate all unique operators across all task types
        var allOperatorIds = receipts.Select(r => r.CreatedByOperatorId)
            .Union(putaways.Select(p => p.OperatorId))
            .Union(picks.Select(p => p.AssignedOperatorId))
            .Union(replenishments.Select(r => r.AssignedTo))
            .Union(counts.Select(c => c.AssignedTo))
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct();

        var list = new List<OperatorProductivityDto>();

        foreach (var operatorId in allOperatorIds)
        {
            int pending = 0;
            int completedToday = 0;

            // Inbound Receipts
            pending += receipts.Count(r => r.CreatedByOperatorId == operatorId && r.Status != InboundReceiptStatus.Received && r.Status != InboundReceiptStatus.CompletedWithExceptions);
            completedToday += receipts.Count(r => r.CreatedByOperatorId == operatorId && (r.Status == InboundReceiptStatus.Received || r.Status == InboundReceiptStatus.CompletedWithExceptions) && r.CreatedAt.Date == today); 

            // Putaway Tasks
            pending += putaways.Count(p => p.OperatorId == operatorId && p.Status != PutawayTaskStatus.Completed);
            completedToday += putaways.Count(p => p.OperatorId == operatorId && p.Status == PutawayTaskStatus.Completed && p.CompletedAt.HasValue && p.CompletedAt.Value.Date == today); 

            // Pick Tasks
            pending += picks.Count(p => p.AssignedOperatorId == operatorId && p.Status != PickTaskStatus.Completed && p.Status != PickTaskStatus.Cancelled && p.Status != PickTaskStatus.Failed);
            completedToday += picks.Count(p => p.AssignedOperatorId == operatorId && p.Status == PickTaskStatus.Completed && p.PickedAt.HasValue && p.PickedAt.Value.Date == today);

            // Replenishment Tasks
            pending += replenishments.Count(r => r.AssignedTo == operatorId && r.Status != ReplenishmentTaskStatus.Completed && r.Status != ReplenishmentTaskStatus.Cancelled);
            completedToday += replenishments.Count(r => r.AssignedTo == operatorId && r.Status == ReplenishmentTaskStatus.Completed && r.CreatedAt.Date == today);

            // Count Tasks
            pending += counts.Count(c => c.AssignedTo == operatorId && c.Status == CountTaskStatus.Pending);
            completedToday += counts.Count(c => c.AssignedTo == operatorId && (c.Status == CountTaskStatus.Counted || c.Status == CountTaskStatus.Adjusted) && c.CreatedAt.Date == today);

            list.Add(new OperatorProductivityDto(operatorId!, pending, completedToday));
        }

        return Result<List<OperatorProductivityDto>>.Success(list.OrderByDescending(x => x.CompletedTasksToday).ToList());
    }
}
