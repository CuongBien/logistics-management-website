using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Dashboard.Queries.GetOperatorProductivityHistory;

public class GetOperatorProductivityHistoryQueryHandler : IRequestHandler<GetOperatorProductivityHistoryQuery, Result<OperatorProductivityHistoryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOperatorProductivityHistoryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OperatorProductivityHistoryDto>> Handle(GetOperatorProductivityHistoryQuery request, CancellationToken cancellationToken)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-30).Date;

        // Query historical logs
        var logsQuery = _context.OperatorActivityLogs.AsNoTracking().Where(l => l.CompletedAt >= cutoffDate);
        if (request.WarehouseId.HasValue)
        {
            logsQuery = logsQuery.Where(l => l.WarehouseId == request.WarehouseId.Value);
        }
        var logs = await logsQuery.ToListAsync(cancellationToken);

        // 1. Calculate Daily Trend
        var trend = logs
            .GroupBy(l => l.CompletedAt.ToLocalTime().ToString("yyyy-MM-dd"))
            .Select(g => new DailyProductivityDto(
                g.Key,
                g.Count(x => x.TaskType == "Putaway"),
                g.Count(x => x.TaskType == "Pick"),
                g.Count(x => x.TaskType == "Replenish"),
                g.Count(x => x.TaskType == "Count")
            ))
            .OrderBy(t => t.Date)
            .ToList();

        // 2. Query current pending tasks for leaderboard
        var putawaysQuery = _context.PutawayTasks.AsNoTracking().Include(p => p.SourceBin).Where(p => p.OperatorId != null && p.Status != PutawayTaskStatus.Completed);
        if (request.WarehouseId.HasValue) putawaysQuery = putawaysQuery.Where(p => p.SourceBin != null && p.SourceBin.WarehouseId == request.WarehouseId.Value);
        var pendingPutaways = await putawaysQuery.ToListAsync(cancellationToken);

        var picksQuery = _context.PickTasks.AsNoTracking().Include(p => p.FromBin).Where(p => p.AssignedOperatorId != null && p.Status != PickTaskStatus.Completed && p.Status != PickTaskStatus.Cancelled && p.Status != PickTaskStatus.Failed);
        if (request.WarehouseId.HasValue) picksQuery = picksQuery.Where(p => p.FromBin != null && p.FromBin.WarehouseId == request.WarehouseId.Value);
        var pendingPicks = await picksQuery.ToListAsync(cancellationToken);

        var replenishmentsQuery = _context.ReplenishmentTasks.AsNoTracking().Where(r => r.AssignedTo != null && r.Status != ReplenishmentTaskStatus.Completed && r.Status != ReplenishmentTaskStatus.Cancelled);
        if (request.WarehouseId.HasValue) replenishmentsQuery = replenishmentsQuery.Where(r => r.WarehouseId == request.WarehouseId.Value);
        var pendingReplenishments = await replenishmentsQuery.ToListAsync(cancellationToken);

        var countsQuery = _context.CountTasks.AsNoTracking().Where(c => c.AssignedTo != null && c.Status == CountTaskStatus.Pending);
        if (request.WarehouseId.HasValue) countsQuery = countsQuery.Where(c => c.WarehouseId == request.WarehouseId.Value);
        var pendingCounts = await countsQuery.ToListAsync(cancellationToken);

        // Group pending counts by operator
        var pendingByOperator = pendingPutaways.GroupBy(p => p.OperatorId!).Select(g => new { OperatorId = g.Key, Count = g.Count() })
            .Concat(pendingPicks.GroupBy(p => p.AssignedOperatorId!).Select(g => new { OperatorId = g.Key, Count = g.Count() }))
            .Concat(pendingReplenishments.GroupBy(r => r.AssignedTo!).Select(g => new { OperatorId = g.Key, Count = g.Count() }))
            .Concat(pendingCounts.GroupBy(c => c.AssignedTo!).Select(g => new { OperatorId = g.Key, Count = g.Count() }))
            .GroupBy(x => x.OperatorId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Count));

        // 3. Build Leaderboard
        var leaderboard = logs
            .GroupBy(l => l.OperatorId)
            .Select(g => new OperatorLeaderboardDto(
                g.Key,
                g.Count(),
                Math.Round(g.Average(x => x.DurationSeconds), 1),
                pendingByOperator.GetValueOrDefault(g.Key, 0)
            ))
            .OrderByDescending(l => l.TotalCompleted)
            .ToList();

        // Include any operators that currently have pending tasks but no completed logs in the last 30 days
        foreach (var opId in pendingByOperator.Keys)
        {
            if (leaderboard.All(l => l.OperatorId != opId))
            {
                leaderboard.Add(new OperatorLeaderboardDto(opId, 0, 0, pendingByOperator[opId]));
            }
        }

        var result = new OperatorProductivityHistoryDto(trend, leaderboard.OrderByDescending(x => x.TotalCompleted).ToList());
        return Result<OperatorProductivityHistoryDto>.Success(result);
    }
}
