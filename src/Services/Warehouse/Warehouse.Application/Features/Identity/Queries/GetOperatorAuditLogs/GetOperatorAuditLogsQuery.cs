using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Identity.Queries.GetOperatorAuditLogs;

public record OperatorAuditLogDto(
    Guid Id,
    string LogType, // "Activity" or "Override"
    string OperatorId,
    string OperatorName,
    string? EmployeeCode,
    string TaskType,
    Guid TaskId,
    string Sku,
    int Quantity,
    DateTime Timestamp,
    string Details,
    string? OriginalBinCode,
    string? ActualBinCode,
    string? Reason,
    double? DurationSeconds
);

public record GetOperatorAuditLogsQuery(
    string? OperatorId = null,
    string? TaskType = null,
    string? LogType = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    Guid? WarehouseId = null
) : IRequest<Result<List<OperatorAuditLogDto>>>;

public class GetOperatorAuditLogsQueryHandler : IRequestHandler<GetOperatorAuditLogsQuery, Result<List<OperatorAuditLogDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOperatorAuditLogsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OperatorAuditLogDto>>> Handle(GetOperatorAuditLogsQuery request, CancellationToken cancellationToken)
    {
        var profiles = await _context.OperatorProfiles
            .AsNoTracking()
            .ToDictionaryAsync(p => p.OperatorSub, p => new { p.DisplayName, p.EmployeeCode }, cancellationToken);

        var list = new List<OperatorAuditLogDto>();

        // 1. Fetch OperatorActivityLogs if LogType is not "Override"
        if (request.LogType == null || string.Equals(request.LogType, "Activity", StringComparison.OrdinalIgnoreCase))
        {
            var activityQuery = _context.OperatorActivityLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(request.OperatorId))
            {
                activityQuery = activityQuery.Where(l => l.OperatorId == request.OperatorId);
            }

            if (!string.IsNullOrEmpty(request.TaskType))
            {
                activityQuery = activityQuery.Where(l => l.TaskType == request.TaskType);
            }

            if (request.FromDate.HasValue)
            {
                activityQuery = activityQuery.Where(l => l.CompletedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                activityQuery = activityQuery.Where(l => l.CompletedAt <= request.ToDate.Value);
            }

            if (request.WarehouseId.HasValue)
            {
                activityQuery = activityQuery.Where(l => l.WarehouseId == request.WarehouseId.Value);
            }

            var activities = await activityQuery
                .OrderByDescending(l => l.CompletedAt)
                .Take(200)
                .ToListAsync(cancellationToken);

            foreach (var act in activities)
            {
                profiles.TryGetValue(act.OperatorId, out var profile);
                var opName = profile?.DisplayName ?? act.OperatorId;
                var empCode = profile?.EmployeeCode;

                list.Add(new OperatorAuditLogDto(
                    act.Id,
                    "Activity",
                    act.OperatorId,
                    opName,
                    empCode,
                    act.TaskType,
                    act.TaskId,
                    act.Sku,
                    act.Quantity,
                    act.CompletedAt,
                    $"Completed {act.TaskType} task of {act.Quantity} units (SKU: {act.Sku}) in {Math.Round(act.DurationSeconds, 1)}s.",
                    null,
                    null,
                    null,
                    act.DurationSeconds
                ));
            }
        }

        // 2. Fetch TaskOverrideLogs if LogType is not "Activity"
        if (request.LogType == null || string.Equals(request.LogType, "Override", StringComparison.OrdinalIgnoreCase))
        {
            var overrideQuery = _context.TaskOverrideLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(request.OperatorId))
            {
                overrideQuery = overrideQuery.Where(l => l.OperatorId == request.OperatorId);
            }

            if (!string.IsNullOrEmpty(request.TaskType))
            {
                overrideQuery = overrideQuery.Where(l => l.TaskType == request.TaskType);
            }

            if (request.FromDate.HasValue)
            {
                overrideQuery = overrideQuery.Where(l => l.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                overrideQuery = overrideQuery.Where(l => l.CreatedAt <= request.ToDate.Value);
            }

            if (request.WarehouseId.HasValue)
            {
                overrideQuery = overrideQuery.Where(l => l.WarehouseId == request.WarehouseId.Value);
            }

            var overrides = await overrideQuery
                .OrderByDescending(l => l.CreatedAt)
                .Take(200)
                .ToListAsync(cancellationToken);

            foreach (var ovr in overrides)
            {
                profiles.TryGetValue(ovr.OperatorId, out var profile);
                var opName = profile?.DisplayName ?? ovr.OperatorId;
                var empCode = profile?.EmployeeCode;

                list.Add(new OperatorAuditLogDto(
                    ovr.Id,
                    "Override",
                    ovr.OperatorId,
                    opName,
                    empCode,
                    ovr.TaskType,
                    ovr.TaskId,
                    ovr.Sku,
                    ovr.Quantity,
                    ovr.CreatedAt,
                    $"Changed suggested bin {ovr.OriginalBinCode} to actual bin {ovr.ActualBinCode} during {ovr.TaskType} task (SKU: {ovr.Sku}). Reason: {ovr.Reason ?? "Not specified"}.",
                    ovr.OriginalBinCode,
                    ovr.ActualBinCode,
                    ovr.Reason,
                    null
                ));
            }
        }

        // Order merged list by Timestamp descending
        var result = list.OrderByDescending(x => x.Timestamp).ToList();
        return Result<List<OperatorAuditLogDto>>.Success(result);
    }
}
