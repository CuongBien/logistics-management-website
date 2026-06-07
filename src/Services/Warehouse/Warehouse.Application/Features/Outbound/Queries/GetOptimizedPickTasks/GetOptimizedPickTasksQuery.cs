using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using System.Linq;

namespace Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks;

public record GetOptimizedPickTasksQuery(string WaveId, string OperatorId) : IRequest<Result<List<PickTaskDto>>>;

public sealed class GetOptimizedPickTasksQueryHandler : IRequestHandler<GetOptimizedPickTasksQuery, Result<List<PickTaskDto>>>
{
    private readonly IApplicationDbContext _context;
    private readonly IOperatorAuthorizationService _authService;

    public GetOptimizedPickTasksQueryHandler(IApplicationDbContext context, IOperatorAuthorizationService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task<Result<List<PickTaskDto>>> Handle(GetOptimizedPickTasksQuery request, CancellationToken cancellationToken)
    {
        // For safety, you might want to query which warehouse this wave belongs to.
        // However, we just check if the user is authorized. We'll find the WarehouseId from one of the PickTasks or just assume they have access to the records if the wave exists.
        // Or we can query the tasks directly.
        var wave = await _context.Waves.FirstOrDefaultAsync(w => w.Id.ToString() == request.WaveId || w.WaveNo == request.WaveId, cancellationToken);
        var searchWaveId = wave != null ? wave.Id.ToString() : request.WaveId;
        var searchWaveNo = wave != null ? wave.WaveNo : request.WaveId;

        var pickTasks = await _context.PickTasks
            .Include(pt => pt.FromBin)
            .Include(pt => pt.OutboundOrderLine).ThenInclude(l => l.OutboundOrder)
            .Where(pt => pt.WaveId == searchWaveId || pt.WaveId == searchWaveNo)
            .OrderBy(pt => pt.FromBin.PickSequence)
            .ThenBy(pt => pt.FromBin.Aisle)
            .ThenBy(pt => pt.FromBin.Rack)
            .ThenBy(pt => pt.FromBin.Shelf)
            .ToListAsync(cancellationToken);

        if (!pickTasks.Any())
        {
            return Result<List<PickTaskDto>>.Success(new List<PickTaskDto>());
        }

        var warehouseId = pickTasks.First().OutboundOrderLine.OutboundOrder.WarehouseId;

        // Verify authorization
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            warehouseId,
            null,
            "outbound:pick",
            cancellationToken);

        if (!hasPermission)
        {
            return Result<List<PickTaskDto>>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:pick' for warehouse '{warehouseId}'."));
        }

        // Auto-claim all Pending tasks in the Wave for the requesting operator
        var pendingTasks = pickTasks.Where(pt => pt.Status == PickTaskStatus.Pending).ToList();
        if (pendingTasks.Any())
        {
            foreach (var task in pendingTasks)
            {
                task.Start(request.OperatorId);
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Fetch SKU details
        var skus = pickTasks.Select(pt => pt.OutboundOrderLine.Sku).Distinct().ToList();
        var skuDetails = await _context.ErpSkuMirrors
            .Where(s => skus.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => s, cancellationToken);

        // Return only InProgress tasks claimed by the current operator
        var dtos = pickTasks
            .Where(pt => pt.Status == PickTaskStatus.InProgress && pt.AssignedOperatorId == request.OperatorId)
            .Select(pt => new PickTaskDto(
                pt.Id,
                pt.OutboundOrderLine.OutboundOrder.OrderNo,
                pt.OutboundOrderLine.Sku,
                skuDetails.ContainsKey(pt.OutboundOrderLine.Sku) ? skuDetails[pt.OutboundOrderLine.Sku].Name : null,
                skuDetails.ContainsKey(pt.OutboundOrderLine.Sku) ? skuDetails[pt.OutboundOrderLine.Sku].UnitOfMeasure : null,
                pt.Quantity,
                pt.FromBin.BinCode,
                pt.FromBin.Aisle,
                pt.FromBin.Rack,
                pt.FromBin.Shelf,
                pt.FromBin.PickSequence,
                pt.Status
            )).ToList();

        return Result<List<PickTaskDto>>.Success(dtos);
    }
}
