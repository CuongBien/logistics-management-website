using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Commands.ShipOrder;

public record ShipOrderCommand(Guid OutboundOrderId, Guid ShipmentId) : IRequest<bool>;

public class ShipOrderCommandHandler : IRequestHandler<ShipOrderCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public ShipOrderCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(ShipOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null) throw new Exception("Order not found");
        
        var shipment = await _context.Shipments
            .Include(s => s.Items)
            .Include(s => s.Orders)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null) throw new Exception("Shipment not found");

        // Idempotency check: Is this order already in this shipment?
        if (shipment.Orders.Any(o => o.OutboundOrderId == request.OutboundOrderId))
        {
            return true;
        }

        // Add order to shipment
        shipment.AddOrder(order.Id);

        foreach (var line in order.Lines)
        {
            // Assuming for this MVP that whatever is Picked is Packed and ready to Ship
            // In reality, there would be a PackOrderCommand in between
            int qtyToShip = line.PickedQty - line.ShippedQty; 
            
            if (qtyToShip > 0)
            {
                line.AddPackedQty(qtyToShip); // Simulating packing
                line.AddShippedQty(qtyToShip);
                
                shipment.AddItem(line.Id, qtyToShip);
            }
        }

        order.ChangeStatus(OutboundOrderStatus.Shipped);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
