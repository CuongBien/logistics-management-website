using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inventory.Commands.ReconcileInventory;

public record ReconcileInventoryCommand(Guid? WarehouseId = null) : IRequest<Result<ReconciliationResult>>
{
    public string OperatorId { get; set; } = string.Empty;
}

public record ReconciliationResult(int ItemsProcessed, int DiscrepanciesFound);

public class ReconcileInventoryHandler : IRequestHandler<ReconcileInventoryCommand, Result<ReconciliationResult>>
{
    private readonly IApplicationDbContext _context;
    private readonly IOperatorAuthorizationService _authService;

    public ReconcileInventoryHandler(IApplicationDbContext context, IOperatorAuthorizationService authService)
    {
        _context = context;
        _authService = authService;
    }

    public async Task<Result<ReconciliationResult>> Handle(ReconcileInventoryCommand request, CancellationToken cancellationToken)
    {
        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            request.WarehouseId ?? Guid.Empty,
            null,
            "inventory:reconcile",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<ReconciliationResult>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inventory:reconcile' for warehouse '{request.WarehouseId}'."));
        }
        var query = _context.InventoryItems.AsQueryable();
        if (request.WarehouseId.HasValue)
        {
            query = query.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        var items = await query.ToListAsync(cancellationToken);
        int discrepancies = 0;

        foreach (var item in items)
        {
            var latestLedger = await _context.InventoryLedgers
                .Where(l => l.InventoryItemId == item.Id)
                .OrderByDescending(l => l.OccurredAt)
                .FirstOrDefaultAsync(cancellationToken);

            int ledgerBalance = latestLedger?.BalanceAfter ?? 0;

            if (latestLedger != null && ledgerBalance != item.QuantityOnHand)
            {
                discrepancies++;

                var existingReport = await _context.InventoryReconciliationReports
                    .FirstOrDefaultAsync(x => x.InventoryItemId == item.Id && x.Status == ReconciliationStatus.Pending, cancellationToken);

                if (existingReport == null)
                {
                    var report = InventoryReconciliationReport.Create(item, ledgerBalance);
                    _context.InventoryReconciliationReports.Add(report);
                }
            }
        }

        if (discrepancies > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return Result<ReconciliationResult>.Success(new ReconciliationResult(items.Count, discrepancies));
    }
}
