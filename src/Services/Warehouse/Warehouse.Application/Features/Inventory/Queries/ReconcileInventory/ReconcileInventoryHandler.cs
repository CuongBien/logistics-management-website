using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inventory.Queries.ReconcileInventory;

public class ReconcileInventoryHandler : IRequestHandler<ReconcileInventoryQuery, bool>
{
    private readonly IApplicationDbContext _context;

    public ReconcileInventoryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ReconcileInventoryQuery request, CancellationToken cancellationToken)
    {
        // Sample window: last N days
        var since = DateTime.UtcNow.AddDays(-request.Days);

        var ledgerSums = await _context.InventoryLedger
            .Where(l => l.OccurredAt >= since)
            .GroupBy(l => new { l.Sku, l.WarehouseId, l.BinId })
            .Select(g => new { g.Key.Sku, g.Key.WarehouseId, g.Key.BinId, Sum = g.Sum(x => x.DeltaQty) })
            .ToListAsync(cancellationToken);

        foreach (var group in ledgerSums)
        {
            var item = await _context.InventoryItems
                .FirstOrDefaultAsync(i => i.Sku == group.Sku && i.WarehouseId == group.WarehouseId && i.BinId == group.BinId, cancellationToken);

            var qtyOnHand = item?.QuantityOnHand ?? 0;

            if (qtyOnHand != group.Sum)
            {
                // For now, just log difference — could persist a report entity or send alert
                // TODO: create InventoryReconciliationReport entity persistence
                Console.WriteLine($"Reconciliation mismatch SKU={group.Sku} WH={group.WarehouseId} BIN={group.BinId} ledgerSum={group.Sum} onHand={qtyOnHand}");
            }
        }

        return true;
    }
}
