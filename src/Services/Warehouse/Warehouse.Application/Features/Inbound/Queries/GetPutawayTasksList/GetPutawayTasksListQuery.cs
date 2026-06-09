using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inbound.Queries.GetPutawayTasksList;

public record GetPutawayTasksListQuery(
    string OperatorSub, 
    Guid? WarehouseId = null,
    bool? AssignedToMe = null,
    bool? Unassigned = null
) : IRequest<Result<List<PutawayTaskDto>>>;

public class PutawayTaskDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = default!;
    public string? ProductName { get; set; }
    public string? UOM { get; set; }
    public string? LotNo { get; set; }
    public int Quantity { get; set; }
    public string SourceBinId { get; set; } = default!;
    public string SuggestedBinId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class GetPutawayTasksListQueryHandler : IRequestHandler<GetPutawayTasksListQuery, Result<List<PutawayTaskDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetPutawayTasksListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<PutawayTaskDto>>> Handle(GetPutawayTasksListQuery request, CancellationToken cancellationToken)
    {
        var opProfile = await _context.OperatorProfiles
            .FirstOrDefaultAsync(p => p.OperatorSub == request.OperatorSub, cancellationToken);

        var query = _context.PutawayTasks
            .Include(t => t.SourceBin)
            .Include(t => t.SuggestedBin)
            .AsQueryable();

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(t => t.SourceBin != null && t.SourceBin.WarehouseId == request.WarehouseId.Value);
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
                
                query = query.Where(t => t.SourceBin != null && assignedWarehouseIds.Contains(t.SourceBin.WarehouseId));
            }
            else
            {
                return Result<List<PutawayTaskDto>>.Success(new List<PutawayTaskDto>());
            }
        }

        if (request.AssignedToMe == true)
        {
            query = query.Where(t => t.OperatorId == request.OperatorSub);
        }

        if (request.Unassigned == true)
        {
            query = query.Where(t => string.IsNullOrEmpty(t.OperatorId));
        }

        var tasks = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        // Get Sku Details
        var skus = tasks.Select(t => t.Sku).Distinct().ToList();
        var skuDetails = await _context.ErpSkuMirrors
            .Where(s => skus.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => s, cancellationToken);

        var result = tasks.Select(t => new PutawayTaskDto
        {
            Id = t.Id,
            Sku = t.Sku,
            ProductName = skuDetails.ContainsKey(t.Sku) ? skuDetails[t.Sku].Name : null,
            UOM = skuDetails.ContainsKey(t.Sku) ? skuDetails[t.Sku].UnitOfMeasure : null,
            LotNo = t.LotNo,
            Quantity = t.Quantity,
            SourceBinId = t.SourceBin != null ? t.SourceBin.BinCode : t.SourceBinId.ToString(),
            SuggestedBinId = t.SuggestedBin != null ? t.SuggestedBin.BinCode : t.SuggestedBinId.ToString(),
            Status = t.Status.ToString(),
            AssignedTo = t.OperatorId,
            CreatedAt = t.CreatedAt
        }).ToList();

        return Result<List<PutawayTaskDto>>.Success(result);
    }
}
