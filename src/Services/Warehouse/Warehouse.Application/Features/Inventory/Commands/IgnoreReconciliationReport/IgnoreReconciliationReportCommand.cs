using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Commands.IgnoreReconciliationReport;

public record IgnoreReconciliationReportCommand(Guid ReportId, string Notes) : IRequest<Result<bool>>;

public class IgnoreReconciliationReportHandler : IRequestHandler<IgnoreReconciliationReportCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public IgnoreReconciliationReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(IgnoreReconciliationReportCommand request, CancellationToken cancellationToken)
    {
        var report = await _context.InventoryReconciliationReports
            .FirstOrDefaultAsync(x => x.Id == request.ReportId && x.Status == ReconciliationStatus.Pending, cancellationToken);

        if (report == null)
        {
            return Result<bool>.Failure(new Error("Report.NotFound", $"Reconciliation report {request.ReportId} not found or already processed."));
        }

        // Ignore report status
        report.Ignore(request.Notes);

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
