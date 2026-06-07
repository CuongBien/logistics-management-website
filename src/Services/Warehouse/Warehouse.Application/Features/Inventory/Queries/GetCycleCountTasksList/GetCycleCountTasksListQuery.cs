using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Queries.GetCycleCountTasksList;

public record GetCycleCountTasksListQuery(string OperatorSub, Guid? WarehouseId = null) : IRequest<Result<List<CycleCountTaskDto>>>;

public class CycleCountTaskDto
{
    public Guid Id { get; set; }
    public string BinId { get; set; } = default!;
    public string Sku { get; set; } = default!;
    public string? ProductName { get; set; }
    public string? UOM { get; set; }
    public int ExpectedQty { get; set; }
    public int? CountedQty { get; set; }
    public string Status { get; set; } = default!;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class GetCycleCountTasksListQueryHandler : IRequestHandler<GetCycleCountTasksListQuery, Result<List<CycleCountTaskDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetCycleCountTasksListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<CycleCountTaskDto>>> Handle(GetCycleCountTasksListQuery request, CancellationToken cancellationToken)
    {
        var opProfile = await _context.OperatorProfiles
            .FirstOrDefaultAsync(p => p.OperatorSub == request.OperatorSub, cancellationToken);

        var query = _context.CountTasks
            .Include(t => t.Bin)
            .AsQueryable();

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(t => t.WarehouseId == request.WarehouseId.Value);
        }
        else
        {
            var isAdmin = request.OperatorSub == "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8" || 
                          (opProfile != null && (opProfile.DisplayName == "admin" || opProfile.DisplayName == "System Admin" || opProfile.OperatorSub == "2036019c-ad5e-4610-9e4f-3e8fb9dfc4e8")) ||
                          await _context.OperatorRoleAssignments.AnyAsync(a => a.OperatorProfile.OperatorSub == request.OperatorSub && a.Role.Code == "WMS_ADMIN", cancellationToken);

            if (isAdmin)
            {
                // Admin sees all tasks
            }
            else if (opProfile != null)
            {
                var assignedWarehouseIds = await _context.OperatorRoleAssignments
                    .Where(a => a.OperatorProfileId == opProfile.Id)
                    .Select(a => a.WarehouseId)
                    .Distinct()
                    .ToListAsync(cancellationToken);
                
                query = query.Where(w => assignedWarehouseIds.Contains(w.WarehouseId));
            }
            else
            {
                return Result<List<CycleCountTaskDto>>.Success(new List<CycleCountTaskDto>());
            }
        }

        var tasks = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var skus = tasks.Select(t => t.Sku).Where(s => s != null).Distinct().ToList();
        var skuDetails = await _context.ErpSkuMirrors
            .Where(s => skus.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => s, cancellationToken);

        var result = tasks.Select(t => new CycleCountTaskDto
        {
            Id = t.Id,
            BinId = t.Bin != null ? t.Bin.BinCode : t.BinId.ToString(),
            Sku = t.Sku,
            ProductName = (t.Sku != null && skuDetails.ContainsKey(t.Sku)) ? skuDetails[t.Sku].Name : null,
            UOM = (t.Sku != null && skuDetails.ContainsKey(t.Sku)) ? skuDetails[t.Sku].UnitOfMeasure : null,
            ExpectedQty = t.ExpectedQty,
            CountedQty = t.CountedQty,
            Status = t.Status.ToString(),
            AssignedTo = t.AssignedTo,
            CreatedAt = t.CreatedAt
        }).ToList();

        return Result<List<CycleCountTaskDto>>.Success(result);
    }
}
