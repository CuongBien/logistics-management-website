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
    private readonly IOperatorAuthorizationService _authService;

    public ShipOrderCommandHandler(
        IApplicationDbContext context, 
        IInventoryService inventoryService,
        ILogger<ShipOrderCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _inventoryService = inventoryService;
        _logger = logger;
        _authService = authService;
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

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            order.WarehouseId,
            null,
            "outbound:load",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:load' for warehouse '{order.WarehouseId}'."));
        }

        if (order.Status == OutboundOrderStatus.Shipped || order.Status == OutboundOrderStatus.Delivered)
            return Result<bool>.Success(true);

        // Chúng ta cho phép Ship từ trạng thái Packed (chuẩn) hoặc Picked (MVP cho phép nhảy bước)
        if (order.Status != OutboundOrderStatus.Packed && order.Status != OutboundOrderStatus.Picked && order.Status != OutboundOrderStatus.PartiallyPicked)
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot ship order in status {order.Status}."));

        Shipment? shipment = null;

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
            // Chế độ Auto: Tìm hoặc tạo dựa trên chặng định tuyến Next-Hop, Geo-Clustering và Consolidation Rules
            var warehouses = await _context.Warehouses.ToListAsync(cancellationToken);
            var sourceWh = warehouses.FirstOrDefault(w => w.Id == order.WarehouseId);

            // 1. Xác định chặng tiếp theo (Next-Hop Routing)
            var destinationKey = order.PartnerId ?? order.DestinationCity ?? order.DestinationAddress ?? "UNKNOWN";
            
            var destWh = warehouses.FirstOrDefault(w => w.Code == order.PartnerId);
            if (destWh == null && !string.IsNullOrEmpty(order.DestinationCity))
            {
                destWh = warehouses.FirstOrDefault(w => 
                    w.Code == order.DestinationCity ||
                    w.Name.Contains(order.DestinationCity, StringComparison.OrdinalIgnoreCase));
            }
            if (destWh != null && sourceWh != null)
            {
                var route = await _context.WarehouseRoutes
                    .FirstOrDefaultAsync(r => r.SourceWarehouseId == sourceWh.Id && r.DestinationWarehouseId == destWh.Id, cancellationToken);

                if (route != null)
                {
                    var nextHopWh = warehouses.FirstOrDefault(w => w.Id == route.NextHopWarehouseId);
                    if (nextHopWh != null)
                    {
                        destinationKey = nextHopWh.Id.ToString();
                        _logger.LogInformation("Multi-Hop Next-Hop Matrix match found. Next hop for order {OrderId} is Warehouse: {NextHopCode}", order.Id, nextHopWh.Code);
                    }
                }
            }

            // 2. Tính toán khoảng cách (Haversine) và chọn phương tiện phù hợp (Consolidation Rules)
            double distanceKm = 0.0;
            string transportMode = "Truck_1_5T"; // Mặc định xe tải nhỏ
            double maxRadiusKm = 15.0;
            decimal maxWeightKg = 1500m;
            decimal maxVolumeCbm = 4.5m;

            if (order.Latitude.HasValue && order.Longitude.HasValue && sourceWh != null && Warehouse.Application.Common.Utils.WarehouseLocationHelper.TryGetCoordinates(sourceWh.Code, out var sourceCoords))
            {
                distanceKm = Warehouse.Application.Common.Utils.HaversineDistanceCalculator.CalculateDistance(
                    sourceCoords.Lat, sourceCoords.Lon, order.Latitude.Value, order.Longitude.Value);
                
                _logger.LogInformation("Calculated distance from source {WhCode} to destination: {Distance:F2} km", sourceWh.Code, distanceKm);

                if (distanceKm <= 2.5)
                {
                    transportMode = "Motorbike";
                    maxRadiusKm = 2.5;
                    maxWeightKg = 50m;
                    maxVolumeCbm = 0.2m;
                }
                else if (distanceKm <= 15.0)
                {
                    transportMode = "Truck_1_5T";
                    maxRadiusKm = 15.0;
                    maxWeightKg = 1500m;
                    maxVolumeCbm = 4.5m;
                }
                else if (distanceKm <= 50.0)
                {
                    transportMode = "Truck_8T";
                    maxRadiusKm = 50.0;
                    maxWeightKg = 8000m;
                    maxVolumeCbm = 24.0m;
                }
                else
                {
                    transportMode = "Container";
                    maxRadiusKm = 500.0;
                    maxWeightKg = 25000m;
                    maxVolumeCbm = 68.0m;
                }
            }

            _logger.LogInformation("Selected transport rule: {Mode} (MaxWeight: {Weight}kg, MaxVolume: {Volume}CBM, MaxRadius: {Radius}km)", 
                transportMode, maxWeightKg, maxVolumeCbm, maxRadiusKm);

            // 3. Quét các chuyến xe đang mở cùng hướng xem có xếp vừa không
            var openShipments = await _context.Shipments
                .Include(s => s.Orders)
                .Where(s => 
                    s.WarehouseId == order.WarehouseId && 
                    s.DestinationId == destinationKey && 
                    (s.Status == ShipmentStatus.Planned || s.Status == ShipmentStatus.Loading))
                .ToListAsync(cancellationToken);

            foreach (var candidate in openShipments)
            {
                decimal currentWeight = 0;
                decimal currentVolume = 0;

                foreach (var shpOrder in candidate.Orders)
                {
                    var o = await _context.OutboundOrders.AsNoTracking().FirstOrDefaultAsync(x => x.Id == shpOrder.OutboundOrderId, cancellationToken);
                    if (o != null)
                    {
                        currentWeight += o.Weight;
                        currentVolume += o.Volume;
                    }
                }

                // Kiểm tra xem sức chứa của xe có chịu tải được thêm đơn hàng này không
                if (currentWeight + order.Weight <= maxWeightKg && currentVolume + order.Volume <= maxVolumeCbm)
                {
                    shipment = candidate;
                    _logger.LogInformation("Consolidated order {OrderId} into shipment {ShipmentNo}. Current Load: {W}kg/{V}CBM.", 
                        order.Id, shipment.ShipmentNo, currentWeight + order.Weight, currentVolume + order.Volume);
                    break;
                }
                else
                {
                    _logger.LogWarning("Shipment {ShipmentNo} capacity exceeded. Current Weight: {CW}kg, Max: {MW}kg.", 
                        candidate.ShipmentNo, currentWeight, maxWeightKg);
                }
            }

            // 4. Tạo chuyến xe mới nếu không có chuyến nào gom chung tải được
            if (shipment == null)
            {
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
                _logger.LogInformation("Created new auto-shipment {ShipmentNo} under {Mode} rule for next hop {Dest}", shipment.ShipmentNo, transportMode, destinationKey);
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
