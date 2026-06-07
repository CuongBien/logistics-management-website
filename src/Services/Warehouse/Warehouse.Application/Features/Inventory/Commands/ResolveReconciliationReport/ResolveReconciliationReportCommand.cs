using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Commands.ResolveReconciliationReport;

public record ResolveReconciliationReportCommand(Guid ReportId, string Notes) : IRequest<Result<bool>>;

public class ResolveReconciliationReportHandler : IRequestHandler<ResolveReconciliationReportCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public ResolveReconciliationReportHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<bool>> Handle(ResolveReconciliationReportCommand request, CancellationToken cancellationToken)
    {
        var report = await _context.InventoryReconciliationReports
            .FirstOrDefaultAsync(x => x.Id == request.ReportId && x.Status == ReconciliationStatus.Pending, cancellationToken);

        if (report == null)
        {
            return Result<bool>.Failure(new Error("Report.NotFound", $"Reconciliation report {request.ReportId} not found or already processed."));
        }

        // Resolve report status
        report.Resolve(request.Notes);

        // Adjust physical InventoryItem to match LedgerQty (reconciliation balance target)
        var item = await _context.InventoryItems.FirstOrDefaultAsync(x => x.Id == report.InventoryItemId, cancellationToken);
        if (item != null)
        {
            int diff = report.SnapshotQty - report.LedgerQty;
            if (diff > 0)
            {
                // QuantityOnHand > LedgerQty: Deduct physical stock to balance with Ledger
                item.Deduct(diff);

                // Log adjustment to ledger
                var ledger = InventoryLedger.Create(
                    item,
                    InventoryLedgerReason.AdjustDecrease,
                    -diff,
                    report.Id.ToString(),
                    "ReconciliationReport",
                    "system",
                    null,
                    item.QuantityOnHand
                );
                _context.InventoryLedgers.Add(ledger);
            }
            else if (diff < 0)
            {
                // QuantityOnHand < LedgerQty: Restock physical stock to balance with Ledger
                int adjustQty = Math.Abs(diff);
                item.Restock(adjustQty);

                // Log adjustment to ledger
                var ledger = InventoryLedger.Create(
                    item,
                    InventoryLedgerReason.AdjustIncrease,
                    adjustQty,
                    report.Id.ToString(),
                    "ReconciliationReport",
                    "system",
                    null,
                    item.QuantityOnHand
                );
                _context.InventoryLedgers.Add(ledger);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
