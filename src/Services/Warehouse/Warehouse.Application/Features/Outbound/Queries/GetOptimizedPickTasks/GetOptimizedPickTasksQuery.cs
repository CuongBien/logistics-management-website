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
        Guid? waveIdGuid = null;
        if (Guid.TryParse(request.WaveId, out var parsedGuid))
        {
            waveIdGuid = parsedGuid;
        }

        var wave = await _context.Waves.FirstOrDefaultAsync(w => 
            (waveIdGuid.HasValue && w.Id == waveIdGuid.Value) || 
            w.WaveNo == request.WaveId, cancellationToken);
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

        // Self-heal completed waves that were finished before auto-completion code was deployed
        if (wave != null && wave.Status != WaveStatus.Completed && wave.Status != WaveStatus.Cancelled && pickTasks.Any())
        {
            var allTerminal = pickTasks.All(t => 
                t.Status == PickTaskStatus.Completed || 
                t.Status == PickTaskStatus.Cancelled || 
                t.Status == PickTaskStatus.Failed);

            if (allTerminal)
            {
                if (wave.Status == WaveStatus.New)
                {
                    wave.StartPicking();
                }
                if (wave.Status == WaveStatus.Picking)
                {
                    wave.Complete();
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }

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

        // Auto-claim all Pending tasks in the Wave
        var pendingTasks = pickTasks.Where(pt => pt.Status == PickTaskStatus.Pending).ToList();
        if (pendingTasks.Any())
        {
            var claimOperatorId = wave != null && !string.IsNullOrEmpty(wave.AssignedOperatorId) 
                ? wave.AssignedOperatorId 
                : request.OperatorId;

            foreach (var task in pendingTasks)
            {
                task.Start(claimOperatorId);

                // E2E DEMO CHANGE: Transition the order status from Allocated/PartiallyAllocated to Picking
                // so that subsequent ConfirmPick transitions are valid within the state machine.
                var order = task.OutboundOrderLine?.OutboundOrder;
                if (order != null && (order.Status == OutboundOrderStatus.Allocated || order.Status == OutboundOrderStatus.PartiallyAllocated))
                {
                    order.UpdateStatus(OutboundOrderStatus.Picking);
                }
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        // Fetch SKU details
        var skus = pickTasks.Select(pt => pt.OutboundOrderLine.Sku).Distinct().ToList();
        var skuDetails = await _context.ErpSkuMirrors
            .Where(s => skus.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => s, cancellationToken);

        // Return all tasks in the wave (letting frontend check status and assignment)
        var dtos = pickTasks
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
                pt.Status,
                pt.AssignedOperatorId
            )).ToList();

        return Result<List<PickTaskDto>>.Success(dtos);
    }
}
