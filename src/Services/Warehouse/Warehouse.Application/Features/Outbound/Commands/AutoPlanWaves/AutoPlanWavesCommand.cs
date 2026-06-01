using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Outbound.Commands.AutoPlanWaves;

public record AutoPlanWavesCommand(
    Guid WarehouseId,
    string OperatorId,
    int MaxSingleItemOrdersPerWave = 50,
    int MaxMultiItemOrdersPerWave = 20) : IRequest<Result<AutoPlanWavesResult>>;

public record AutoPlanWavesResult(List<string> CreatedWaveIds, int TotalOrdersPlanned);

public sealed class AutoPlanWavesCommandHandler : IRequestHandler<AutoPlanWavesCommand, Result<AutoPlanWavesResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<AutoPlanWavesCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public AutoPlanWavesCommandHandler(
        IApplicationDbContext context, 
        ILogger<AutoPlanWavesCommandHandler> logger, 
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<AutoPlanWavesResult>> Handle(AutoPlanWavesCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting Auto Plan Waves for Warehouse {WarehouseId}", request.WarehouseId);

        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            request.WarehouseId,
            null,
            "outbound:pick",
            cancellationToken);

        if (!hasPermission)
        {
            return Result<AutoPlanWavesResult>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:pick' for warehouse '{request.WarehouseId}'."));
        }

        // 1. Fetch eligible orders (Allocated / PartiallyAllocated, no existing pick tasks)
        // We only pick orders where ALL lines have at least some active reservations (or we just pick whatever has reservations).
        var eligibleOrders = await _context.OutboundOrders
            .Include(o => o.Lines)
            .Where(o => o.WarehouseId == request.WarehouseId && 
                       (o.Status == OutboundOrderStatus.Allocated || o.Status == OutboundOrderStatus.PartiallyAllocated) &&
                       !o.OrderNo.StartsWith("SORTED-"))
            .ToListAsync(cancellationToken);

        // Filter out orders that already have PickTasks
        var existingPickTaskOrderIds = await _context.PickTasks
            .Include(pt => pt.OutboundOrderLine)
            .Select(pt => pt.OutboundOrderLine.OutboundOrderId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var ordersToPlan = eligibleOrders
            .Where(o => !existingPickTaskOrderIds.Contains(o.Id))
            .ToList();

        if (!ordersToPlan.Any())
        {
            return Result<AutoPlanWavesResult>.Success(new AutoPlanWavesResult(new List<string>(), 0));
        }

        // Pre-fetch all active reservations for these orders
        var orderIds = ordersToPlan.Select(o => o.Id.ToString()).ToList();
        var allReservations = await _context.InventoryReservations
            .Include(r => r.InventoryItem)
            .Where(r => orderIds.Contains(r.ReferenceId) && r.ReferenceType == ReservationType.OutboundOrder && r.Status == ReservationStatus.Active)
            .ToListAsync(cancellationToken);

        var singleItemOrders = new List<OutboundOrder>();
        var multiItemOrders = new List<OutboundOrder>();

        foreach (var order in ordersToPlan)
        {
            var totalQty = order.Lines.Sum(l => l.RequestedQty);
            if (order.Lines.Count == 1 && totalQty == 1)
            {
                singleItemOrders.Add(order);
            }
            else
            {
                multiItemOrders.Add(order);
            }
        }

        var createdWaves = new List<string>();
        int totalOrdersPlanned = 0;
        var nowTimestamp = DateTime.UtcNow.ToString("HHmmss");

        // 2. Process Single-Item Orders
        var singleChunks = singleItemOrders.Chunk(request.MaxSingleItemOrdersPerWave);
        int sglIndex = 1;
        foreach (var chunk in singleChunks)
        {
            string waveNo = $"WAVE-SGL-{nowTimestamp}-{sglIndex:D2}";
            var wave = Wave.Create(waveNo, request.WarehouseId, WaveType.SingleItem, chunk.Length);
            
            if (ProcessChunk(chunk, allReservations, waveNo))
            {
                _context.Waves.Add(wave);
                createdWaves.Add(waveNo);
                totalOrdersPlanned += chunk.Length;
            }
            sglIndex++;
        }

        // 3. Process Multi-Item Orders
        var multiChunks = multiItemOrders.Chunk(request.MaxMultiItemOrdersPerWave);
        int mulIndex = 1;
        foreach (var chunk in multiChunks)
        {
            string waveNo = $"WAVE-MUL-{nowTimestamp}-{mulIndex:D2}";
            var wave = Wave.Create(waveNo, request.WarehouseId, WaveType.MultiItem, chunk.Length);
            
            if (ProcessChunk(chunk, allReservations, waveNo))
            {
                _context.Waves.Add(wave);
                createdWaves.Add(waveNo);
                totalOrdersPlanned += chunk.Length;
            }
            mulIndex++;
        }

        await _context.SaveChangesAsync(cancellationToken);
        
        _logger.LogInformation("Auto Plan Waves completed. Generated {WaveCount} waves for {TotalOrders} orders.", createdWaves.Count, totalOrdersPlanned);
        
        return Result<AutoPlanWavesResult>.Success(new AutoPlanWavesResult(createdWaves, totalOrdersPlanned));
    }

    private bool ProcessChunk(IEnumerable<OutboundOrder> chunk, List<InventoryReservation> allReservations, string waveId)
    {
        bool hasAnyTask = false;
        foreach (var order in chunk)
        {
            bool orderHasTasks = false;
            foreach (var line in order.Lines)
            {
                var lineReservations = allReservations
                    .Where(r => r.ReferenceId == order.Id.ToString() && r.InventoryItem.Sku == line.Sku)
                    .ToList();

                foreach (var res in lineReservations)
                {
                    if (res.Quantity > 0)
                    {
                        var pickTask = PickTask.Create(line.Id, res.InventoryItem.BinId, res.Quantity, waveId);
                        _context.PickTasks.Add(pickTask);
                        orderHasTasks = true;
                        hasAnyTask = true;
                    }
                }
            }
            
            if (orderHasTasks)
            {
                order.UpdateStatus(OutboundOrderStatus.Picking);
            }
        }
        return hasAnyTask;
    }
}
