using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Commands.ReserveStock;

public class ReserveStockCommandHandler : IRequestHandler<ReserveStockCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ReserveStockCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ReserveStockCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null)
            throw new Exception("Order not found");

        if (order.Status != OutboundOrderStatus.Draft)
            return true; // Already reserved or past draft state (Idempotent)

        foreach (var line in order.Lines)
        {
            // Simple logic for reserve: Find available inventory
            var inventoryItems = await _context.InventoryItems
                .Where(i => i.Sku == line.SkuCode && (i.QuantityOnHand - i.ReservedQty) > 0)
                .ToListAsync(cancellationToken);

            int needed = line.RequestedQty;
            foreach (var inv in inventoryItems)
            {
                if (needed <= 0) break;
                
                int canReserve = Math.Min(inv.AvailableQty, needed);
                
                inv.ReserveStock(canReserve);
                line.AddReservedQty(canReserve);
                
                needed -= canReserve;
            }

            if (needed > 0 && !order.AllowPartial)
                throw new Exception($"Insufficient stock for SKU {line.SkuCode}");
        }

        order.ChangeStatus(OutboundOrderStatus.Allocated);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
