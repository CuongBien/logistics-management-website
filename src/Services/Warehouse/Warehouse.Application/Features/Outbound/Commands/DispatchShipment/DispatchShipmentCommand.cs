using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.DispatchShipment;

public record DispatchShipmentCommand(Guid ShipmentId, string OperatorId) : IRequest<Result<bool>>;

public sealed class DispatchShipmentCommandHandler : IRequestHandler<DispatchShipmentCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<DispatchShipmentCommandHandler> _logger;

    public DispatchShipmentCommandHandler(
        IApplicationDbContext context,
        IInventoryService inventoryService,
        ILogger<DispatchShipmentCommandHandler> logger)
    {
        _context = context;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(DispatchShipmentCommand request, CancellationToken cancellationToken)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Orders)
                .ThenInclude(so => so.OutboundOrder)
                    .ThenInclude(o => o.Lines)
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == request.ShipmentId, cancellationToken);

        if (shipment == null)
            return Result<bool>.Failure(Error.NotFound("Shipment.NotFound", "Shipment not found"));

        if (shipment.Status == ShipmentStatus.Shipped || shipment.Status == ShipmentStatus.Delivered)
            return Result<bool>.Success(true);

        _logger.LogInformation("Dispatching Shipment {ShipmentNo} with {OrderCount} orders", shipment.ShipmentNo, shipment.Orders.Count);

        // 1. Duyệt qua từng đơn hàng trong chuyến xe
        foreach (var shipOrder in shipment.Orders)
        {
            var order = shipOrder.OutboundOrder;
            
            // Lấy các Reservation đang chờ của đơn này
            var reservations = await _context.InventoryReservations
                .Include(r => r.InventoryItem)
                .Where(r => r.ReferenceId == order.Id.ToString() && r.ReferenceType == ReservationType.OutboundOrder && r.Status == ReservationStatus.Active)
                .ToListAsync(cancellationToken);

            foreach (var line in order.Lines)
            {
                int qtyToShip = line.PickedQty - line.ShippedQty;
                if (qtyToShip <= 0) continue;

                // Cập nhật số lượng đã xuất trong đơn hàng
                line.UpdateShipped(line.ShippedQty + qtyToShip);

                // Thực hiện trừ tồn kho thực tế qua InventoryService
                var lineReservations = reservations.Where(r => r.InventoryItem.Sku == line.Sku).ToList();
                foreach (var res in lineReservations)
                {
                    await _inventoryService.ConsumeAsync(res.Id, request.OperatorId, cancellationToken);
                }
            }

            // Chuyển đơn hàng sang trạng thái SHIPPED (Đã rời kho)
            order.UpdateStatus(OutboundOrderStatus.Shipped);
        }

        // 2. Chuyển chuyến xe sang trạng thái SHIPPED
        shipment.MarkShipped();

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Shipment {ShipmentNo} dispatched successfully", shipment.ShipmentNo);
        return Result<bool>.Success(true);
    }
}
