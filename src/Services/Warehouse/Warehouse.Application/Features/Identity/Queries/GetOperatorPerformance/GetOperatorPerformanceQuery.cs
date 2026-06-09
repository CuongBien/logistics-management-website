using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Identity.Queries.GetOperatorPerformance;

public record PendingTaskDto(
    Guid TaskId,
    string TaskType,
    string Sku,
    int Quantity,
    DateTime CreatedAt
);

public record CompletedTaskLogDto(
    Guid TaskId,
    string TaskType,
    string Sku,
    int Quantity,
    DateTime CompletedAt,
    double DurationSeconds
);

public record OperatorPerformanceDto(
    string OperatorSub,
    int TotalCompleted,
    double AverageDurationSeconds,
    int TotalPending,
    List<PendingTaskDto> PendingTasks,
    List<CompletedTaskLogDto> RecentCompletedTasks,
    Dictionary<string, int> CompletedCountByType
);

public record GetOperatorPerformanceQuery(string OperatorSub) : IRequest<Result<OperatorPerformanceDto>>;

public class GetOperatorPerformanceQueryHandler : IRequestHandler<GetOperatorPerformanceQuery, Result<OperatorPerformanceDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOperatorPerformanceQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OperatorPerformanceDto>> Handle(GetOperatorPerformanceQuery request, CancellationToken cancellationToken)
    {
        // 1. Fetch pending putaway tasks
        var pendingPutaways = await _context.PutawayTasks
            .AsNoTracking()
            .Where(p => p.OperatorId == request.OperatorSub && p.Status == PutawayTaskStatus.Pending)
            .Select(p => new PendingTaskDto(p.Id, "Putaway", p.Sku, p.Quantity, p.CreatedAt))
            .ToListAsync(cancellationToken);

        // 2. Fetch pending pick tasks
        var pendingPicks = await _context.PickTasks
            .AsNoTracking()
            .Include(p => p.OutboundOrderLine)
            .Where(p => p.AssignedOperatorId == request.OperatorSub && 
                       (p.Status == PickTaskStatus.Pending || p.Status == PickTaskStatus.InProgress))
            .Select(p => new PendingTaskDto(p.Id, "Pick", p.OutboundOrderLine != null ? p.OutboundOrderLine.Sku : "Unknown SKU", p.Quantity, p.CreatedAt))
            .ToListAsync(cancellationToken);

        // 3. Fetch pending replenishment tasks
        var pendingReplenishments = await _context.ReplenishmentTasks
            .AsNoTracking()
            .Where(r => r.AssignedTo == request.OperatorSub && 
                       (r.Status == ReplenishmentTaskStatus.Pending || r.Status == ReplenishmentTaskStatus.InProgress))
            .Select(r => new PendingTaskDto(r.Id, "Replenish", r.Sku, r.RequestedQty, r.CreatedAt))
            .ToListAsync(cancellationToken);

        // 4. Fetch pending count tasks
        var pendingCounts = await _context.CountTasks
            .AsNoTracking()
            .Where(c => c.AssignedTo == request.OperatorSub && c.Status == CountTaskStatus.Pending)
            .Select(c => new PendingTaskDto(c.Id, "Count", c.Sku, c.ExpectedQty, c.CreatedAt))
            .ToListAsync(cancellationToken);

        // Merge pending tasks
        var pendingTasks = new List<PendingTaskDto>();
        pendingTasks.AddRange(pendingPutaways);
        pendingTasks.AddRange(pendingPicks);
        pendingTasks.AddRange(pendingReplenishments);
        pendingTasks.AddRange(pendingCounts);

        // 5. Query historical logs
        var allLogs = await _context.OperatorActivityLogs
            .AsNoTracking()
            .Where(l => l.OperatorId == request.OperatorSub)
            .ToListAsync(cancellationToken);

        var totalCompleted = allLogs.Count;
        var avgDuration = allLogs.Any() ? allLogs.Average(l => l.DurationSeconds) : 0;

        var completedCountByType = allLogs
            .GroupBy(l => l.TaskType)
            .ToDictionary(g => g.Key, g => g.Count());

        var recentCompleted = allLogs
            .OrderByDescending(l => l.CompletedAt)
            .Take(15)
            .Select(l => new CompletedTaskLogDto(
                l.TaskId,
                l.TaskType,
                l.Sku,
                l.Quantity,
                l.CompletedAt,
                l.DurationSeconds
            ))
            .ToList();

        var dto = new OperatorPerformanceDto(
            request.OperatorSub,
            totalCompleted,
            Math.Round(avgDuration, 1),
            pendingTasks.Count,
            pendingTasks.OrderByDescending(t => t.CreatedAt).ToList(),
            recentCompleted,
            completedCountByType
        );

        return Result<OperatorPerformanceDto>.Success(dto);
    }
}
