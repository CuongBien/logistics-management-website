using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inbound.Queries.GetPutawayTasksList;

public record GetPutawayTasksListQuery(string OperatorSub) : IRequest<Result<List<PutawayTaskDto>>>;

public class PutawayTaskDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = default!;
    public int Quantity { get; set; }
    public string SourceBinId { get; set; } = default!;
    public string SuggestedBinId { get; set; } = default!;
    public string Status { get; set; } = default!;
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

        var isAdmin = request.OperatorSub == "e8426038-ce83-4e21-a754-f1834a77267e" || 
                      (opProfile != null && (opProfile.DisplayName == "admin" || opProfile.OperatorSub == "e8426038-ce83-4e21-a754-f1834a77267e"));

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
            return Result<List<PutawayTaskDto>>.Success(new List<PutawayTaskDto>());
        }

        var tasks = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var result = tasks.Select(t => new PutawayTaskDto
        {
            Id = t.Id,
            Sku = t.Sku,
            Quantity = t.Quantity,
            SourceBinId = t.SourceBin != null ? t.SourceBin.BinCode : t.SourceBinId.ToString(),
            SuggestedBinId = t.SuggestedBin != null ? t.SuggestedBin.BinCode : t.SuggestedBinId.ToString(),
            Status = t.Status.ToString(),
            CreatedAt = t.CreatedAt
        }).ToList();

        return Result<List<PutawayTaskDto>>.Success(result);
    }
}
