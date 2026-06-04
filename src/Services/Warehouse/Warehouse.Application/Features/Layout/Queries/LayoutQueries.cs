using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Layout.DTOs;

namespace Warehouse.Application.Features.Layout.Queries;

public record GetWarehousesQuery(string OperatorSub = "") : IRequest<Result<List<WarehouseDto>>>;

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
        IQueryable<Warehouse.Domain.Entities.Warehouse> query = _context.Warehouses;

        if (!string.IsNullOrEmpty(request.OperatorSub))
        {
            // Find operator profile
            var opProfile = await _context.OperatorProfiles
                .FirstOrDefaultAsync(x => x.OperatorSub == request.OperatorSub, cancellationToken);

            var isAdmin = request.OperatorSub == "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8" || 
                          (opProfile != null && (opProfile.DisplayName == "admin" || opProfile.OperatorSub == "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8"));

            if (isAdmin)
            {
                // Admin sees all warehouses
            }
            else if (opProfile != null)
            {
                // Find all assignments for this operator
                var assignedWarehouseIds = await _context.OperatorRoleAssignments
                    .Where(a => a.OperatorProfileId == opProfile.Id)
                    .Select(a => a.WarehouseId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
                
                var validIds = assignedWarehouseIds;
                query = query.Where(w => validIds.Contains(w.Id));
            }
            else
            {
                // User not found in OperatorProfiles yet -> return no warehouses
                return Result<List<WarehouseDto>>.Success(new List<WarehouseDto>());
            }
        }

        var warehouses = await query
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
