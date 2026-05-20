using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Errors;
using EventBus.Messages.Events;
using MassTransit;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Outbound.Commands.SortOrder;

public class SortOrderCommandHandler : IRequestHandler<SortOrderCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IOperatorAuthorizationService _authService;

    public SortOrderCommandHandler(
        IApplicationDbContext context, 
        IPublishEndpoint publishEndpoint,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _authService = authService;
    }

    public async Task<Result> Handle(SortOrderCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TenantId))
        {
            return Result.Failure(new Error("Tenant.Missing", "TenantId is required for sorting operation."));
        }

        if (string.IsNullOrWhiteSpace(request.CustomerId))
        {
            return Result.Failure(new Error("Customer.Missing", "CustomerId is required for sorting operation."));
        }

        // 1. Determine Source Warehouse and find OutboundOrder
        var outboundOrder = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId, cancellationToken);

        Guid sourceWarehouseId;
        Bin? bin = null;
        InboundReceipt? inboundReceipt = null;

        if (outboundOrder != null)
        {
            // Case A: Multi-leg Transit Order or already sorted order
            sourceWarehouseId = outboundOrder.WarehouseId;
            
            if (outboundOrder.Status == OutboundOrderStatus.Shipped || outboundOrder.Status == OutboundOrderStatus.Loaded)
            {
                // Already processed idempotently
                return Result.Success();
            }
        }
        else
        {
            // Case B: First-time sort for Standard Courier Order (Bưu cục lẻ) or Cross-region Consignment
            // 1. Tìm Bin đang chứa OrderId
            bin = await _context.Bins
                .Include(b => b.Zone)
                .ThenInclude(z => z.Block)
                .FirstOrDefaultAsync(b => b.CurrentOrderId == request.OrderId, cancellationToken);

            if (bin == null)
            {
                return Result.Failure(new Error("Outbound.InvalidOrderType", $"Sort action is strictly reserved for standard courier orders (bưu cục lẻ) that are received into sorting bins. No occupied bin found containing Order ID {request.OrderId}."));
            }

            sourceWarehouseId = bin.Zone.Block.WarehouseId;

            inboundReceipt = await _context.InboundReceipts
                .Include(r => r.Lines)
                .FirstOrDefaultAsync(r => r.OrderId == request.OrderId, cancellationToken);

            if (inboundReceipt == null)
            {
                return Result.Failure(new Error("Outbound.InvalidOrderType", $"Sort action is reserved for standard courier orders (bưu cục lẻ) and cross-region consignments. No inbound receipt found for Order ID {request.OrderId}."));
            }

            if (inboundReceipt.Lines.Count == 0)
            {
                return Result.Failure(new Error("InboundReceipt.Empty", $"Inbound receipt for courier Order ID {request.OrderId} has no lines."));
            }
        }

        // ============================================================
        // RESOLVE DESTINATION WAREHOUSE ID
        // Priority: 1) Explicit request param  2) InboundReceipt.FinalDestinationWarehouseId  3) OutboundOrder.PartnerId
        // ============================================================
        Guid resolvedDestinationId;

        if (request.DestinationWarehouseId.HasValue)
        {
            // Client explicitly provided the destination
            resolvedDestinationId = request.DestinationWarehouseId.Value;
        }
        else if (inboundReceipt?.FinalDestinationWarehouseId.HasValue == true)
        {
            // Cross-region consignment: destination was stored on InboundReceipt at creation time
            resolvedDestinationId = inboundReceipt.FinalDestinationWarehouseId.Value;
        }
        else if (outboundOrder != null && !string.IsNullOrWhiteSpace(outboundOrder.PartnerId) && Guid.TryParse(outboundOrder.PartnerId, out var parsedPartnerId))
        {
            // Multi-hop transit: destination stored on existing OutboundOrder
            resolvedDestinationId = parsedPartnerId;
        }
        else
        {
            return Result.Failure(new Error("Sort.MissingDestination",
                "DestinationWarehouseId is required for first-time sort when no final destination is recorded on the inbound receipt."));
        }

        // 2. Check RBAC Permission
        var zoneId = bin?.ZoneId; 
        var hasPermission = await _authService.HasPermissionAsync(
            request.CustomerId, 
            sourceWarehouseId, 
            zoneId, 
            "outbound:sort", 
            cancellationToken);

        if (!hasPermission)
        {
            return Result.Failure(new Error(
                "Operator.Forbidden",
                $"Operator '{request.CustomerId}' does not have permission 'outbound:sort' for warehouse '{sourceWarehouseId}' and zone '{zoneId}' (if applicable)."));
        }

        if (bin != null)
        {
            // 2. Bin.Status = Available (Giải phóng Bin)
            bin.Release();
        }

        var sourceShipmentNo = request.SourceShipmentNo;
        if (string.IsNullOrWhiteSpace(sourceShipmentNo))
        {
            sourceShipmentNo = $"ASN-{request.OrderId:N}";
        }

        // Query source and destination warehouses for coordinates
        var warehouses = await _context.Warehouses.ToListAsync(cancellationToken);
        var sourceWh = warehouses.FirstOrDefault(w => w.Id == sourceWarehouseId);
        var destWh = warehouses.FirstOrDefault(w => w.Id == resolvedDestinationId);

        if (destWh == null)
        {
            return Result.Failure(Error.NotFound("Warehouse.NotFound", $"Destination warehouse with ID {resolvedDestinationId} not found."));
        }

        // Calculate weight and volume for shipping limit checks
        decimal totalWeight = 0;
        decimal totalVolume = 0;

        if (outboundOrder == null)
        {
            // Calculate from inbound receipt for new sorted order
            foreach (var line in inboundReceipt!.Lines)
            {
                var qty = line.ReceivedQuantity > 0 ? line.ReceivedQuantity : line.ExpectedQuantity;
                totalWeight += qty * 1.2m; // Fallback 1.2kg per item
            }
            totalVolume = totalWeight * 0.003m;
        }
        else
        {
            // Use existing order's metrics
            totalWeight = outboundOrder.Weight;
            totalVolume = outboundOrder.Volume;
            if (totalWeight <= 0)
            {
                foreach (var line in outboundOrder.Lines)
                {
                    var qty = line.PickedQty > 0 ? line.PickedQty : line.RequestedQty;
                    totalWeight += qty * 1.2m;
                }
                totalVolume = totalWeight * 0.003m;
            }
        }

        // 1. Next-Hop Matrix Routing
        var destinationKey = resolvedDestinationId.ToString();
        if (sourceWh != null)
        {
            var route = await _context.WarehouseRoutes
                .FirstOrDefaultAsync(r => r.SourceWarehouseId == sourceWh.Id && r.DestinationWarehouseId == destWh.Id, cancellationToken);

            if (route != null)
            {
                var nextHopWh = warehouses.FirstOrDefault(w => w.Id == route.NextHopWarehouseId);
                if (nextHopWh != null)
                {
                    destinationKey = nextHopWh.Id.ToString();
                }
            }
        }

        // 2. Compute Distance (Haversine) and Select Vehicle
        double distanceKm = 0.0;
        string transportMode = "Truck_1_5T"; // Default
        double maxRadiusKm = 15.0;
        decimal maxWeightKg = 1500m;
        decimal maxVolumeCbm = 4.5m;

        double? destLat = destWh!.Latitude;
        double? destLon = destWh!.Longitude;

        if (!destLat.HasValue || !destLon.HasValue)
        {
            if (destWh!.Code != null && Warehouse.Application.Common.Utils.WarehouseLocationHelper.TryGetCoordinates(destWh.Code, out var destCoords))
            {
                destLat = destCoords.Lat;
                destLon = destCoords.Lon;
            }
        }

        if (destLat.HasValue && destLon.HasValue && sourceWh != null)
        {
            double sourceLat = sourceWh.Latitude ?? 0;
            double sourceLon = sourceWh.Longitude ?? 0;

            if (sourceLat == 0 && sourceLon == 0 && sourceWh.Code != null)
            {
                if (Warehouse.Application.Common.Utils.WarehouseLocationHelper.TryGetCoordinates(sourceWh.Code, out var sourceCoords))
                {
                    sourceLat = sourceCoords.Lat;
                    sourceLon = sourceCoords.Lon;
                }
            }

            if (sourceLat != 0 && sourceLon != 0)
            {
                distanceKm = Warehouse.Application.Common.Utils.HaversineDistanceCalculator.CalculateDistance(
                    sourceLat, sourceLon, destLat.Value, destLon.Value);

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
        }

        Console.WriteLine($"SortOrder: Distance calculated {distanceKm:F2} km, selected transport mode {transportMode} (max radius {maxRadiusKm} km, max weight {maxWeightKg} kg, max volume {maxVolumeCbm} cbm).");

        if (outboundOrder == null)
        {
            outboundOrder = new OutboundOrder(
                request.OrderId, 
                request.TenantId, 
                request.CustomerId, 
                sourceWarehouseId, 
                orderNo: $"SORTED-{request.OrderId.ToString()[..8].ToUpper()}",
                destinationAddress: destWh!.Name,
                destinationCity: destWh!.Code,
                priority: 0,
                allowPartial: true,
                partnerId: resolvedDestinationId.ToString(),
                latitude: destLat,
                longitude: destLon,
                weight: totalWeight,
                volume: totalVolume);

            _context.OutboundOrders.Add(outboundOrder);

            // Add lines corresponding to received/expected items
            foreach (var receiptLine in inboundReceipt!.Lines)
            {
                var qty = receiptLine.ReceivedQuantity > 0 ? receiptLine.ReceivedQuantity : receiptLine.ExpectedQuantity;
                if (qty <= 0) continue;

                outboundOrder.AddLine(receiptLine.Sku, qty, "PCS");
            }

            // Populate line progress counters
            foreach (var line in outboundOrder.Lines)
            {
                line.UpdateReserved(line.RequestedQty);
                line.UpdatePicked(line.RequestedQty);
                line.UpdatePacked(line.RequestedQty);
            }

            // State machine compliant step-by-step transition from Draft to Packed
            outboundOrder.UpdateStatus(OutboundOrderStatus.Allocated);
            outboundOrder.UpdateStatus(OutboundOrderStatus.Picking);
            outboundOrder.UpdateStatus(OutboundOrderStatus.Picked);
            outboundOrder.UpdateStatus(OutboundOrderStatus.Packed);
        }

        // 3. Scan for an open Shipment going in the same direction
        Shipment? shipment = null;

        var openShipments = await _context.Shipments
            .Include(s => s.Orders)
            .Where(s => 
                s.WarehouseId == sourceWarehouseId && 
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

            if (currentWeight + totalWeight <= maxWeightKg && currentVolume + totalVolume <= maxVolumeCbm)
            {
                shipment = candidate;
                break;
            }
        }

        if (shipment == null)
        {
            // No matching shipment found, create dedicated run
            var uniquePart = Guid.NewGuid().ToString("N")[..8].ToUpper();
            var shipmentNo = $"SHP-{sourceWarehouseId.ToString()[..8]}-{DateTime.UtcNow:yyyyMMddHHmmss}-{uniquePart}";
            shipment = new Shipment(
                tenantId: request.TenantId,
                customerId: request.CustomerId,
                shipmentNo: shipmentNo,
                warehouseId: sourceWarehouseId,
                destinationType: DestinationType.Warehouse,
                destinationId: destinationKey
            );
            _context.Shipments.Add(shipment);
        }

        // Consolidate or load into new/existing shipment
        shipment.AddOrder(outboundOrder.Id);
        shipment.MarkLoading();

        foreach (var line in outboundOrder.Lines)
        {
            int qtyToShip = line.PickedQty - line.ShippedQty;
            if (qtyToShip > 0)
            {
                shipment.AddItem(line.Id, qtyToShip);
            }
        }

        outboundOrder.UpdateStatus(OutboundOrderStatus.Loaded);

        // 3. Publish Integration Event (Transactional Outbox will handle persistence)
        await _publishEndpoint.Publish(new ShipmentSortedIntegrationEvent(
            request.OrderId,
            resolvedDestinationId.ToString(),
            DateTime.UtcNow,
            request.TenantId,
            request.CustomerId,
            shipment.ShipmentNo), cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
