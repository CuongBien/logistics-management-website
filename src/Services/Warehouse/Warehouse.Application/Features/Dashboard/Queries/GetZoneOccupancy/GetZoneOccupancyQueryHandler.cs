using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Dashboard.Queries.GetZoneOccupancy;

public class GetZoneOccupancyQueryHandler : IRequestHandler<GetZoneOccupancyQuery, Result<List<ZoneOccupancyDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetZoneOccupancyQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ZoneOccupancyDto>>> Handle(GetZoneOccupancyQuery request, CancellationToken cancellationToken)
    {
        // Get all zones in this warehouse
        var zones = await _context.Zones
            .Include(z => z.Block)
            .Where(z => z.Block.WarehouseId == request.WarehouseId && !z.IsDeleted)
            .ToListAsync(cancellationToken);

        // Get all bins in this warehouse
        var bins = await _context.Bins
            .Where(b => b.WarehouseId == request.WarehouseId && !b.IsDeleted)
            .ToListAsync(cancellationToken);

        // Get all operator assignments in this warehouse
        var assignments = await _context.OperatorRoleAssignments
            .Where(a => a.WarehouseId == request.WarehouseId)
            .ToListAsync(cancellationToken);

        // Get active pick tasks in this warehouse
        var activePicks = await _context.PickTasks
            .Include(p => p.FromBin)
            .Where(p => p.FromBin.WarehouseId == request.WarehouseId && 
                       p.Status != PickTaskStatus.Completed && 
                       p.Status != PickTaskStatus.Cancelled && 
                       p.Status != PickTaskStatus.Failed)
            .ToListAsync(cancellationToken);

        // Get active putaway tasks in this warehouse
        var activePutaways = await _context.PutawayTasks
            .Include(p => p.SourceBin)
            .Where(p => p.SourceBin.WarehouseId == request.WarehouseId && 
                       p.Status != PutawayTaskStatus.Completed)
            .ToListAsync(cancellationToken);

        var list = new List<ZoneOccupancyDto>();

        foreach (var zone in zones)
        {
            var zoneBins = bins.Where(b => b.ZoneId == zone.Id).ToList();
            int totalBins = zoneBins.Count;
            int occupiedOrFull = zoneBins.Count(b => b.Status == BinStatus.Occupied.ToString() || b.Status == BinStatus.Full.ToString());
            int capacity = totalBins == 0 ? 0 : (int)Math.Round((double)occupiedOrFull / totalBins * 100);

            // Count workers assigned to this zone (or warehouse-wide, but we prefer zone-specific if available)
            int workers = assignments.Count(a => a.ZoneId == zone.Id);
            if (workers == 0 && zone.ZoneType == ZoneType.Storage.ToString())
            {
                // Fallback: if no operator is assigned to this zone specificially, count warehouse storage role operators
                workers = assignments.Count(a => a.ZoneId == null);
            }

            // Count active tasks in this zone
            int activeOrders = activePicks.Count(p => p.FromBin.ZoneId == zone.Id) + 
                               activePutaways.Count(p => p.SourceBin.ZoneId == zone.Id);

            // Count alerts: full bins count, or general warning
            int alerts = zoneBins.Count(b => b.Status == BinStatus.Full.ToString());

            // Build user-friendly Zone Name: e.g. "Storage Zone" or "Block A - Staging"
            string name = $"{zone.Block.BlockCode} - {zone.ZoneType}";

            list.Add(new ZoneOccupancyDto(
                zone.Id.ToString(),
                name,
                activeOrders,
                workers,
                capacity,
                alerts
            ));
        }

        return Result<List<ZoneOccupancyDto>>.Success(list.OrderBy(z => z.Name).ToList());
    }
}
