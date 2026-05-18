using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Common.Utils;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Outbound.Queries.GetOrderTrackingTimeline;

public record GetOrderTrackingTimelineQuery(Guid OrderId) : IRequest<Result<OrderTrackingDto>>;

public class GetOrderTrackingTimelineQueryHandler : IRequestHandler<GetOrderTrackingTimelineQuery, Result<OrderTrackingDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderTrackingTimelineQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderTrackingDto>> Handle(GetOrderTrackingTimelineQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.OutboundOrders
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return Result<OrderTrackingDto>.Failure(Error.NotFound("Order.NotFound", "Outbound order not found"));

        var warehouses = await _context.Warehouses.ToDictionaryAsync(w => w.Id, w => w, cancellationToken);
        var sourceWh = warehouses.GetValueOrDefault(order.WarehouseId);
        
        var dto = new OrderTrackingDto
        {
            OrderId = order.Id,
            OrderNo = order.OrderNo,
            Status = order.Status.ToString(),
            SlaDeadline = order.PlannedShipAt ?? order.CreatedAt.AddDays(3),
            Timeline = new List<TimelineEventDto>()
        };

        // 1. Creation Event
        dto.Timeline.Add(new TimelineEventDto
        {
            Timestamp = order.CreatedAt,
            Location = sourceWh?.Name ?? "Unknown Hub",
            EventType = "OrderCreated",
            Description = "Order received and allocated."
        });

        // 2. Fetch past Transit Events
        var shipmentOrders = await _context.ShipmentOrders
            .Include(so => so.Shipment)
            .Where(so => so.OutboundOrderId == request.OrderId)
            .OrderBy(so => so.Shipment.CreatedAt)
            .ToListAsync(cancellationToken);

        var receipts = await _context.InboundReceipts
            .Where(r => r.OrderId == request.OrderId && r.Status == InboundReceiptStatus.Received)
            .OrderBy(r => r.ReceivedAt)
            .ToListAsync(cancellationToken);

        Guid currentWarehouseId = order.WarehouseId;
        DateTime lastEventTime = order.CreatedAt;

        foreach (var so in shipmentOrders)
        {
            var shipment = so.Shipment;
            var fromWh = warehouses.GetValueOrDefault(shipment.WarehouseId);

            // Loaded Event
            dto.Timeline.Add(new TimelineEventDto
            {
                Timestamp = shipment.CreatedAt,
                Location = fromWh?.Name ?? "Unknown Hub",
                EventType = "ShipmentLoaded",
                Description = $"Loaded onto shipment {shipment.ShipmentNo}."
            });
            lastEventTime = shipment.CreatedAt;

            // Dispatched Event
            if (shipment.ShippedAt.HasValue)
            {
                dto.Timeline.Add(new TimelineEventDto
                {
                    Timestamp = shipment.ShippedAt.Value,
                    Location = fromWh?.Name ?? "Unknown Hub",
                    EventType = "ShipmentDispatched",
                    Description = $"Departed from {fromWh?.Name}."
                });
                lastEventTime = shipment.ShippedAt.Value;
                currentWarehouseId = Guid.Empty; // In transit
            }

            // Find matching receipt for this shipment's destination
            if (Guid.TryParse(shipment.DestinationId, out Guid destWhId))
            {
                var receipt = receipts.FirstOrDefault(r => r.WarehouseId == destWhId && r.ReceivedAt > shipment.ShippedAt);
                if (receipt != null && receipt.ReceivedAt.HasValue)
                {
                    var destWh = warehouses.GetValueOrDefault(destWhId);
                    dto.Timeline.Add(new TimelineEventDto
                    {
                        Timestamp = receipt.ReceivedAt.Value,
                        Location = destWh?.Name ?? "Unknown Hub",
                        EventType = "TransitReceived",
                        Description = $"Arrived at {destWh?.Name}."
                    });
                    lastEventTime = receipt.ReceivedAt.Value;
                    currentWarehouseId = destWhId; // Reached hub
                }
            }
            else if (shipment.Status == ShipmentStatus.Delivered)
            {
                dto.Timeline.Add(new TimelineEventDto
                {
                    Timestamp = shipment.ShippedAt?.AddHours(12) ?? DateTime.UtcNow,
                    Location = order.DestinationCity ?? "Customer Address",
                    EventType = "Delivered",
                    Description = "Delivered to customer."
                });
                dto.Status = "Delivered";
            }
        }

        // 3. Predict Future ETAs
        if (order.Status != OutboundOrderStatus.Delivered && order.Status != OutboundOrderStatus.Shipped && currentWarehouseId != Guid.Empty)
        {
            var destWh = warehouses.Values.FirstOrDefault(w => w.Code == order.PartnerId) 
                         ?? warehouses.Values.FirstOrDefault(w => w.Code == order.DestinationCity);

            if (destWh != null && currentWarehouseId != destWh.Id)
            {
                var routes = await _context.WarehouseRoutes.ToListAsync(cancellationToken);
                
                Guid hopSourceId = currentWarehouseId;
                DateTime currentEta = lastEventTime > DateTime.UtcNow ? lastEventTime : DateTime.UtcNow;

                int maxHops = 10;
                while (hopSourceId != destWh.Id && maxHops-- > 0)
                {
                    var route = routes.FirstOrDefault(r => r.SourceWarehouseId == hopSourceId && r.DestinationWarehouseId == destWh.Id);
                    if (route == null) break;

                    var nextHopId = route.NextHopWarehouseId;
                    var hopSourceWh = warehouses.GetValueOrDefault(hopSourceId);
                    var hopTargetWh = warehouses.GetValueOrDefault(nextHopId);

                    if (hopSourceWh != null && hopTargetWh != null)
                    {
                        double distanceKm = 0;
                        if (WarehouseLocationHelper.TryGetCoordinates(hopSourceWh.Code, out var sourceCoords) &&
                            WarehouseLocationHelper.TryGetCoordinates(hopTargetWh.Code, out var targetCoords))
                        {
                            distanceKm = HaversineDistanceCalculator.CalculateDistance(sourceCoords.Lat, sourceCoords.Lon, targetCoords.Lat, targetCoords.Lon);
                        }
                        
                        // ETA Calculation
                        double speedKmH = 45.0; // Default Truck
                        if (distanceKm > 300) speedKmH = 60.0; // Container for long haul
                        else if (distanceKm < 20) speedKmH = 30.0; // Motorbike/Small truck
                        
                        // Apply 1.2 road multiplier + 2 hours buffer per hub
                        double travelHours = (distanceKm * 1.2) / speedKmH;
                        currentEta = currentEta.AddHours(travelHours + 2.0);

                        dto.Timeline.Add(new TimelineEventDto
                        {
                            Timestamp = currentEta,
                            Location = hopTargetWh.Name,
                            EventType = "EstimatedArrival",
                            Description = $"ETA based on {distanceKm:F0}km distance (Speed: {speedKmH}km/h).",
                            IsFuture = true
                        });
                    }

                    hopSourceId = nextHopId;
                }
            }
        }

        // 4. SLA Breach Check
        var finalEtaEvent = dto.Timeline.LastOrDefault();
        if (finalEtaEvent != null && finalEtaEvent.Timestamp > dto.SlaDeadline)
        {
            dto.IsSlaBreached = true;
        }
        else if (order.Status != OutboundOrderStatus.Delivered && DateTime.UtcNow > dto.SlaDeadline)
        {
            dto.IsSlaBreached = true;
        }

        return Result<OrderTrackingDto>.Success(dto);
    }
}
