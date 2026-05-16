using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.ShipOrder;

public record ShipOrderCommand(
    Guid OutboundOrderId, 
    string OperatorId,
    Guid? ShipmentId = null) : IRequest<Result<bool>>;

public sealed class ShipOrderCommandHandler : IRequestHandler<ShipOrderCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<ShipOrderCommandHandler> _logger;

    public ShipOrderCommandHandler(
        IApplicationDbContext context, 
        IInventoryService inventoryService,
        ILogger<ShipOrderCommandHandler> logger)
    {
        _context = context;
        _inventoryService = inventoryService;
        _logger = logger;
    }

    public async Task<Result<bool>> Handle(ShipOrderCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Shipping OutboundOrder {OrderId}. Manual Shipment: {IsManual}", 
            request.OutboundOrderId, request.ShipmentId.HasValue);

        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null)
            return Result<bool>.Failure(Error.NotFound("OutboundOrder.NotFound", "Order not found"));

        if (order.Status == OutboundOrderStatus.Shipped || order.Status == OutboundOrderStatus.Delivered)
            return Result<bool>.Success(true);

        // Chúng ta cho phép Ship từ trạng thái Packed (chuẩn) hoặc Picked (MVP cho phép nhảy bước)
        if (order.Status != OutboundOrderStatus.Packed && order.Status != OutboundOrderStatus.Picked && order.Status != OutboundOrderStatus.PartiallyPicked)
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot ship order in status {order.Status}."));

        // 1. Xác định Shipment
        Shipment? shipment;

        if (request.ShipmentId.HasValue)
        {
            // Chế độ Manual: Dùng ShipmentId được chỉ định
            shipment = await _context.Shipments
                .Include(s => s.Orders)
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => s.Id == request.ShipmentId.Value, cancellationToken);

            if (shipment == null)
                return Result<bool>.Failure(Error.NotFound("Shipment.NotFound", "Specified Shipment not found"));
            
            if (shipment.Status >= ShipmentStatus.Shipped && shipment.Status <= ShipmentStatus.Delivered)
                return Result<bool>.Failure(new Error("Shipment.InvalidStatus", "Cannot add order to an already shipped shipment."));
        }
        else
        {
            // Chế độ Auto: Tìm hoặc tạo dựa trên địa chỉ (Ưu tiên PartnerId để gom đơn chính xác)
            var destinationKey = order.PartnerId ?? order.DestinationCity ?? order.DestinationAddress ?? "UNKNOWN";
            shipment = await _context.Shipments
                .Include(s => s.Orders)
                .Include(s => s.Items)
                .FirstOrDefaultAsync(s => 
                    s.WarehouseId == order.WarehouseId && 
                    s.DestinationId == destinationKey && 
                    (s.Status == ShipmentStatus.Planned || s.Status == ShipmentStatus.Loading), cancellationToken);

            if (shipment == null)
            {
                // Thêm 4 số ngẫu nhiên để tránh trùng mã trong cùng 1 giây
                var randomPart = new Random().Next(1000, 9999);
                var shipmentNo = $"SHP-{order.WarehouseId.ToString()[..8]}-{DateTime.UtcNow:yyyyMMddHHmmss}-{randomPart}";
                shipment = new Shipment(
                    tenantId: order.TenantId,
                    customerId: order.CustomerId,
                    shipmentNo: shipmentNo,
                    warehouseId: order.WarehouseId,
                    destinationType: DestinationType.Other,
                    destinationId: destinationKey
                );
                _context.Shipments.Add(shipment);
                _logger.LogInformation("Created new auto-shipment {ShipmentNo} for destination {Dest}", shipment.ShipmentNo, destinationKey);
            }
        }

        // Link Order to Shipment
        shipment.AddOrder(order.Id);
        shipment.MarkLoading(); // Chuyển sang trạng thái đang đóng hàng

        // Update Order Status to LOADED (Chờ xuất bến)
        foreach (var line in order.Lines)
        {
            int qtyToShip = line.PickedQty - line.ShippedQty;
            if (qtyToShip <= 0) continue;
            
            shipment.AddItem(line.Id, qtyToShip);
            // Lưu ý: Chưa gọi line.UpdateShipped vì hàng chưa thực sự rời kho
        }

        order.UpdateStatus(OutboundOrderStatus.Loaded);
        
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Order {OrderId} loaded into Shipment {ShipmentNo} successfully", order.Id, shipment.ShipmentNo);
        return Result<bool>.Success(true);
    }
}
