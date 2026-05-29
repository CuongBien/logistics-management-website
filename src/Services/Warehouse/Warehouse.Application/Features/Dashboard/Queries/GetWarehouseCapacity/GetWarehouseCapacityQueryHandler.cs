using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Dashboard.Queries.GetWarehouseCapacity;

public class GetWarehouseCapacityQueryHandler : IRequestHandler<GetWarehouseCapacityQuery, Result<WarehouseCapacityDto>>
{
    private readonly IApplicationDbContext _context;

    public GetWarehouseCapacityQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<WarehouseCapacityDto>> Handle(GetWarehouseCapacityQuery request, CancellationToken cancellationToken)
    {
        var bins = await _context.Bins.AsNoTracking().ToListAsync(cancellationToken);

        int totalBins = bins.Count;
        int emptyBins = bins.Count(b => b.Status == BinStatus.Available.ToString());
        int occupiedBins = bins.Count(b => b.Status == BinStatus.Occupied.ToString());
        int fullBins = bins.Count(b => b.Status == BinStatus.Full.ToString());

        double occupancyRate = totalBins == 0 ? 0 : Math.Round((double)(occupiedBins + fullBins) / totalBins * 100, 2);

        var dto = new WarehouseCapacityDto(
            totalBins,
            emptyBins,
            occupiedBins,
            fullBins,
            occupancyRate
        );

        return Result<WarehouseCapacityDto>.Success(dto);
    }
}
