using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Dashboard.Queries.GetOperatorProductivity;

public class GetOperatorProductivityQueryHandler : IRequestHandler<GetOperatorProductivityQuery, Result<List<OperatorProductivityDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOperatorProductivityQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OperatorProductivityDto>>> Handle(GetOperatorProductivityQuery request, CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;

        // Inbound Receipts
        var receiptsQuery = _context.InboundReceipts.AsNoTracking().Where(r => r.CreatedByOperatorId != null);
        if (request.WarehouseId.HasValue) receiptsQuery = receiptsQuery.Where(r => r.WarehouseId == request.WarehouseId.Value);
        var receipts = await receiptsQuery.ToListAsync(cancellationToken);

        // Putaway Tasks
        var putawaysQuery = _context.PutawayTasks.AsNoTracking().Include(p => p.SourceBin).Where(p => p.OperatorId != null);
        if (request.WarehouseId.HasValue) putawaysQuery = putawaysQuery.Where(p => p.SourceBin != null && p.SourceBin.WarehouseId == request.WarehouseId.Value);
        var putaways = await putawaysQuery.ToListAsync(cancellationToken);
            
        // We can aggregate per operator
        var allOperatorIds = receipts.Select(r => r.CreatedByOperatorId)
            .Union(putaways.Select(p => p.OperatorId))
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct();

        var profiles = await _context.OperatorProfiles.AsNoTracking().ToListAsync(cancellationToken);

        var list = new List<OperatorProductivityDto>();

        foreach (var operatorId in allOperatorIds)
        {
            int pending = 0;
            int completedToday = 0;

            pending += receipts.Count(r => r.CreatedByOperatorId == operatorId && r.Status != InboundReceiptStatus.Received && r.Status != InboundReceiptStatus.CompletedWithExceptions);
            completedToday += receipts.Count(r => r.CreatedByOperatorId == operatorId && (r.Status == InboundReceiptStatus.Received || r.Status == InboundReceiptStatus.CompletedWithExceptions) && r.CreatedAt.Date == today); 

            pending += putaways.Count(p => p.OperatorId == operatorId && p.Status != PutawayTaskStatus.Completed);
            completedToday += putaways.Count(p => p.OperatorId == operatorId && p.Status == PutawayTaskStatus.Completed && p.CompletedAt.HasValue && p.CompletedAt.Value.Date == today); 

            var profile = profiles.FirstOrDefault(p => p.OperatorSub == operatorId || p.Id.ToString() == operatorId);
            string displayName = profile != null ? profile.DisplayName : operatorId!;

            list.Add(new OperatorProductivityDto(displayName, pending, completedToday));
        }

        return Result<List<OperatorProductivityDto>>.Success(list.OrderByDescending(x => x.CompletedTasksToday).ToList());
    }
}
