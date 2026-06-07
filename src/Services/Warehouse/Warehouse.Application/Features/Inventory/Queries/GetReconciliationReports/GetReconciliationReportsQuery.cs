using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Queries.GetReconciliationReports;

public record GetReconciliationReportsQuery(Guid? WarehouseId = null) : IRequest<Result<List<ReconciliationReportDto>>>;

public record ReconciliationReportDto(
    Guid Id,
    Guid InventoryItemId,
    string Sku,
    Guid WarehouseId,
    Guid BinId,
    string? LotNo,
    int SnapshotQty,
    int LedgerQty,
    int Difference,
    DateTime DetectedAt,
    ReconciliationStatus Status,
    string? ResolutionNotes);

public class GetReconciliationReportsHandler : IRequestHandler<GetReconciliationReportsQuery, Result<List<ReconciliationReportDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetReconciliationReportsHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ReconciliationReportDto>>> Handle(GetReconciliationReportsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.InventoryReconciliationReports.AsNoTracking().AsQueryable();

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        var list = await query
            .OrderByDescending(x => x.DetectedAt)
            .Select(x => new ReconciliationReportDto(
                x.Id,
                x.InventoryItemId,
                x.Sku,
                x.WarehouseId,
                x.BinId,
                x.LotNo,
                x.SnapshotQty,
                x.LedgerQty,
                x.Difference,
                x.DetectedAt,
                x.Status,
                x.ResolutionNotes))
            .ToListAsync(cancellationToken);

        return Result<List<ReconciliationReportDto>>.Success(list);
    }
}
