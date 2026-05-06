using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Layout.DTOs;

namespace Warehouse.Application.Features.Layout.Queries;

public record GetWarehousesQuery() : IRequest<Result<List<WarehouseDto>>>;

public record GetWarehouseHierarchyQuery(Guid WarehouseId) : IRequest<Result<WarehouseHierarchyDto>>;

public class LayoutQueryHandlers : 
    IRequestHandler<GetWarehousesQuery, Result<List<WarehouseDto>>>,
    IRequestHandler<GetWarehouseHierarchyQuery, Result<WarehouseHierarchyDto>>
{
    private readonly IApplicationDbContext _context;

    public LayoutQueryHandlers(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<WarehouseDto>>> Handle(GetWarehousesQuery request, CancellationToken cancellationToken)
    {
        var warehouses = await _context.Warehouses
            .Select(w => new WarehouseDto(w.Id, w.Name, w.Code, w.LocationText))
            .ToListAsync(cancellationToken);

        return Result<List<WarehouseDto>>.Success(warehouses);
    }

    public async Task<Result<WarehouseHierarchyDto>> Handle(GetWarehouseHierarchyQuery request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses
            .Include(w => w.Blocks)
                .ThenInclude(b => b.Zones)
                    .ThenInclude(z => z.Bins)
            .FirstOrDefaultAsync(w => w.Id == request.WarehouseId, cancellationToken);

        if (warehouse == null)
            return Result<WarehouseHierarchyDto>.Failure(new Error("Warehouse.NotFound", $"Warehouse {request.WarehouseId} not found."));

        var dto = new WarehouseHierarchyDto(
            warehouse.Id,
            warehouse.Name,
            warehouse.Code,
            warehouse.Blocks.Select(b => new BlockHierarchyDto(
                b.Id,
                b.BlockCode,
                b.Zones.Select(z => new ZoneHierarchyDto(
                    z.Id,
                    z.ZoneType,
                    z.Bins.Select(bn => new BinDto(bn.Id, bn.WarehouseId, bn.ZoneId, bn.BinCode, bn.Status)).ToList()
                )).ToList()
            )).ToList()
        );

        return Result<WarehouseHierarchyDto>.Success(dto);
    }
}
