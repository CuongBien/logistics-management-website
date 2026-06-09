using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Api.Controllers.Requests;
using Logistics.Core;
using Warehouse.Domain.Entities;
using Warehouse.Application.Features.Outbound.Commands.ShipAndReleaseBin;

namespace Warehouse.Api.Controllers;

[ApiController]
[Tags("Outbound")]
[Route("api/outbound")]
public class OutboundController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public OutboundController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("orders/{orderId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetOutboundOrder(string orderId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        
        var cleanOrderId = orderId.Trim();
        if (cleanOrderId.StartsWith("OB:", System.StringComparison.OrdinalIgnoreCase))
            cleanOrderId = cleanOrderId[3..];
        else if (cleanOrderId.StartsWith("ORD:", System.StringComparison.OrdinalIgnoreCase))
            cleanOrderId = cleanOrderId[4..];
            
        OutboundOrder? order = null;
        if (Guid.TryParse(cleanOrderId, out var guidId))
        {
            order = await _context.OutboundOrders
                .Include(x => x.Lines)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => (x.OrderId == guidId || x.Id == guidId) && x.TenantId == tenantId);
        }
        else
        {
            order = await _context.OutboundOrders
                .Include(x => x.Lines)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.OrderNo == cleanOrderId && x.TenantId == tenantId);
        }

        if (order == null) return NotFound(new { Message = $"Outbound order for OrderId {orderId} not found." });

        // Merge PackVerifications progress into the returned lines' PackedQty for active session display
        var pvs = await _context.PackVerifications
            .Where(p => p.OutboundOrderId == order.Id)
            .AsNoTracking()
            .ToListAsync();

        foreach (var line in order.Lines)
        {
            var pv = pvs.FirstOrDefault(p => p.Sku == line.Sku);
            if (pv != null)
            {
                line.UpdatePacked(pv.ScannedQty);
            }
        }

        return Ok(order);
    }

    [HttpGet("orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetOrders([FromQuery] Guid? warehouseId)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await Mediator.Send(new Warehouse.Application.Features.Outbound.Queries.GetOutboundOrdersList.GetOutboundOrdersListQuery(operatorSub, warehouseId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("shipments")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetShipments([FromQuery] Guid? warehouseId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var query = _context.Shipments
            .Where(x => x.TenantId == tenantId);
            
        if (warehouseId.HasValue)
        {
            query = query.Where(x => x.WarehouseId == warehouseId.Value);
        }

        var shipments = await query
            .Include(x => x.Orders)
            .OrderByDescending(x => x.CreatedAt)
            .Take(1000)
            .Select(x => new
            {
                x.Id,
                x.TenantId,
                x.CustomerId,
                x.ShipmentNo,
                x.WarehouseId,
                x.DestinationType,
                x.DestinationId,
                x.Carrier,
                x.RouteId,
                x.TrackingNo,
                x.Status,
                orderCount = x.Orders.Count,
                x.CreatedAt,
                x.ShippedAt
            })
            .ToListAsync();

        return Ok(shipments);
    }

    [HttpPut("sort")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SortOrder([FromBody] SortOrderRequest request)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(operatorId))
        {
            return BadRequest(new { Code = "TenantOrOperator.MissingClaim", Message = "Missing tenant/operator claim in access token." });
        }

        var sourceShipmentNo = request.SourceShipmentNo;
        if (string.IsNullOrWhiteSpace(sourceShipmentNo))
        {
            sourceShipmentNo = $"ASN-{request.OrderId:N}";
        }

        var finalCommand = new SortOrderCommand(
            request.OrderId,
            request.DestinationWarehouseId,
            tenantId,
            operatorId,
            sourceShipmentNo);

        var result = await Mediator.Send(finalCommand);
        return ToActionResult(result);
    }

    [HttpPost("orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Guid>> CreateOrder([FromBody] CreateOutboundOrderRequest request)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        
        var customerId = string.IsNullOrWhiteSpace(request.CustomerId) ? "cust-default" : request.CustomerId;

        var command = new Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder.CreateOutboundOrderCommand(
            tenantId, 
            customerId,
            operatorId,
            request.WarehouseId, 
            request.OrderId, 
            request.OrderNo,
            request.DestinationAddress,
            request.DestinationCity,
            request.Priority,
            request.AllowPartial,
            request.PlannedShipAt, 
            request.Lines,
            request.PartnerId,
            request.Latitude,
            request.Longitude,
            request.Weight,
            request.Volume);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("orders/{id:guid}/allocate")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> AllocateOrder(Guid id)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.AllocateStock.AllocateStockCommand(id, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("orders/{id:guid}/pick")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> PickOrder(Guid id, [FromBody] PickOrderRequest? request)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.PickStock.PickStockCommand(id, CurrentUserClaims.GetCustomerId(User) ?? string.Empty, request?.WaveId);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("pick-tasks/{taskId:guid}/confirm")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> ConfirmPick(Guid taskId)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.PickStock.ConfirmPickCommand(taskId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpGet("orders/{orderId}/pick-tasks")]
    public async Task<ActionResult<List<Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks.PickTaskDto>>> GetPickTasksByOrder(string orderId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var cleanOrderId = orderId.Trim();
        if (cleanOrderId.StartsWith("OB:", System.StringComparison.OrdinalIgnoreCase))
            cleanOrderId = cleanOrderId[3..];
        else if (cleanOrderId.StartsWith("ORD:", System.StringComparison.OrdinalIgnoreCase))
            cleanOrderId = cleanOrderId[4..];

        Guid? resolvedOrderId = null;
        if (Guid.TryParse(cleanOrderId, out var guidId))
        {
            resolvedOrderId = guidId;
        }
        else
        {
            var order = await _context.OutboundOrders
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.OrderNo == cleanOrderId && x.TenantId == tenantId);
            if (order != null)
            {
                resolvedOrderId = order.Id;
            }
        }

        if (resolvedOrderId == null)
        {
            return NotFound(new { Message = $"Outbound order {orderId} not found." });
        }

        var tasks = await _context.PickTasks
            .Include(pt => pt.OutboundOrderLine).ThenInclude(ol => ol.OutboundOrder)
            .Include(pt => pt.FromBin)
            .Where(pt => pt.OutboundOrderLine.OutboundOrderId == resolvedOrderId.Value)
            .ToListAsync();

        var skus = tasks.Select(pt => pt.OutboundOrderLine.Sku).Distinct().ToList();
        var skuDetails = await _context.ErpSkuMirrors
            .Where(s => skus.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => s);

        var dtos = tasks
            .Select(pt => new Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks.PickTaskDto(
                pt.Id,
                pt.OutboundOrderLine.OutboundOrder.OrderNo,
                pt.OutboundOrderLine.Sku,
                skuDetails.ContainsKey(pt.OutboundOrderLine.Sku) ? skuDetails[pt.OutboundOrderLine.Sku].Name : null,
                skuDetails.ContainsKey(pt.OutboundOrderLine.Sku) ? skuDetails[pt.OutboundOrderLine.Sku].UnitOfMeasure : null,
                pt.Quantity,
                pt.FromBin.BinCode,
                pt.FromBin.Aisle,
                pt.FromBin.Rack,
                pt.FromBin.Shelf,
                pt.FromBin.PickSequence,
                pt.Status,
                pt.AssignedOperatorId
            )).ToList();

        return Ok(dtos);
    }

    [HttpPost("orders/{id:guid}/pack")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> PackOrder(Guid id)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.PackOrder.PackOrderCommand(id, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("orders/{id:guid}/ship")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> ShipOrder(Guid id, [FromBody] ShipOrderRequest? request)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.ShipOrder.ShipOrderCommand(
            id, 
            CurrentUserClaims.GetCustomerId(User) ?? string.Empty,
            request?.ShipmentId);
            
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("orders/ship-and-release")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<ShipAndReleaseBinResult>> ShipAndReleaseBin([FromBody] ShipAndReleaseBinRequest request)
    {
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var command = new ShipAndReleaseBinCommand(request.OrderNo, operatorId);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    [HttpGet("orders/{id:guid}/shipment")]
    public async Task<ActionResult> GetShipmentByOrder(Guid id)
    {
        var shipmentOrder = await _context.ShipmentOrders
            .Include(x => x.Shipment)
            .OrderByDescending(x => x.Shipment.CreatedAt)
            .FirstOrDefaultAsync(x => x.OutboundOrderId == id);
            
        if (shipmentOrder == null) return NotFound(new { Message = $"Shipment not found for Outbound Order {id}." });
        return Ok(new { ShipmentId = shipmentOrder.ShipmentId });
    }

    [HttpGet("orders/{id:guid}/tracking-timeline")]
    [ProducesResponseType(typeof(Warehouse.Application.Features.Outbound.Queries.GetOrderTrackingTimeline.OrderTrackingDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<Warehouse.Application.Features.Outbound.Queries.GetOrderTrackingTimeline.OrderTrackingDto>> GetOrderTrackingTimeline(Guid id)
    {
        var query = new Warehouse.Application.Features.Outbound.Queries.GetOrderTrackingTimeline.GetOrderTrackingTimelineQuery(id);
        return ToActionResult(await Mediator.Send(query));
    }

    [HttpPost("shipments/{id:guid}/dispatch")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> DispatchShipment(Guid id)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.DispatchShipment.DispatchShipmentCommand(id, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpGet("shipments/{shipmentId:guid}/orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetShipmentOrders(Guid shipmentId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var shipment = await _context.Shipments
            .FirstOrDefaultAsync(x => x.Id == shipmentId && x.TenantId == tenantId);

        if (shipment == null)
            return NotFound(new { Message = $"Shipment {shipmentId} not found." });

        var orders = await _context.ShipmentOrders
            .Where(x => x.ShipmentId == shipmentId)
            .Include(x => x.OutboundOrder)
                .ThenInclude(o => o.Lines)
            .Select(x => x.OutboundOrder)
            .ToListAsync();

        return Ok(orders);
    }

    [HttpPost("orders/{id:guid}/cancel")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> CancelOrder(Guid id)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.CancelOutboundOrder.CancelOutboundOrderCommand(id, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("orders/{id:guid}/putaway")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> PutawayCancelledOrder(Guid id, [FromBody] PutawayCancelledOrderRequest request)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.PutawayCancelledOrder.PutawayCancelledOrderCommand(
            id, 
            request.TargetBinCode, 
            CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("shipments/{id:guid}/return")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> ReturnShipment(Guid id, [FromBody] ReceiveReturnShipmentRequest request)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.ReceiveReturnShipment.ReceiveReturnShipmentCommand(
            id, 
            request.TargetBinCode, 
            CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpGet("returns")]
    [ProducesResponseType(typeof(List<Warehouse.Application.Features.Outbound.Queries.GetReturnsList.OutboundReturnDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Warehouse.Application.Features.Outbound.Queries.GetReturnsList.OutboundReturnDto>>> GetReturns([FromQuery] Guid warehouseId)
    {
        var query = new Warehouse.Application.Features.Outbound.Queries.GetReturnsList.GetReturnsListQuery(warehouseId);
        return ToActionResult(await Mediator.Send(query));
    }

    [HttpPost("returns/disposition")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> ProcessReturnDisposition([FromBody] ProcessReturnDispositionRequest request)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var customerId = "cust-default"; // Hoặc lấy từ claim nếu có

        var command = new Warehouse.Application.Features.Outbound.Commands.ProcessReturnDisposition.ProcessReturnDispositionCommand(
            request.WarehouseId,
            request.Sku,
            request.Quantity,
            request.Condition,
            request.TargetBinCode,
            request.ReferenceId,
            request.ReferenceType,
            request.Notes,
            operatorId,
            tenantId,
            customerId
        );

        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("waves/auto-plan")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Warehouse.Application.Features.Outbound.Commands.AutoPlanWaves.AutoPlanWavesResult>> AutoPlanWaves([FromBody] AutoPlanWavesRequest request)
    {
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var command = new Warehouse.Application.Features.Outbound.Commands.AutoPlanWaves.AutoPlanWavesCommand(
            request.WarehouseId,
            operatorId,
            request.MaxSingleItemOrdersPerWave,
            request.MaxMultiItemOrdersPerWave
        );
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpGet("waves")]
    [ProducesResponseType(typeof(List<Warehouse.Application.Features.Outbound.Queries.GetWavesList.WaveDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Warehouse.Application.Features.Outbound.Queries.GetWavesList.WaveDto>>> GetWaves([FromQuery] Guid warehouseId)
    {
        var query = new Warehouse.Application.Features.Outbound.Queries.GetWavesList.GetWavesListQuery(warehouseId);
        return ToActionResult(await Mediator.Send(query));
    }

    [HttpGet("waves/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetWave(Guid id)
    {
        var wave = await _context.Waves.FirstOrDefaultAsync(w => w.Id == id);
        if (wave == null) return NotFound(new { Message = $"Wave {id} not found." });

        return Ok(new {
            Id = wave.Id,
            WaveNo = wave.WaveNo,
            Type = wave.Type.ToString(),
            Status = wave.Status.ToString(),
            OrderCount = wave.OrderCount,
            CreatedAt = wave.CreatedAt,
            WarehouseId = wave.WarehouseId
        });
    }

    [HttpPost("waves/{id}/start")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> StartWave(string id)
    {
        var cleanId = id.Trim();
        if (cleanId.StartsWith("OB:", System.StringComparison.OrdinalIgnoreCase))
            cleanId = cleanId[3..];
        else if (cleanId.StartsWith("ORD:", System.StringComparison.OrdinalIgnoreCase))
            cleanId = cleanId[4..];

        if (Guid.TryParse(cleanId, out var waveGuid))
        {
            var command = new Warehouse.Application.Features.Outbound.Commands.StartWave.StartWaveCommand(waveGuid);
            return ToActionResult(await Mediator.Send(command));
        }
        else
        {
            // Direct Order Assignment fallback
            var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
            var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
            var order = await _context.OutboundOrders
                .FirstOrDefaultAsync(x => x.OrderNo == cleanId && x.TenantId == tenantId);
            if (order == null)
            {
                return NotFound(new { Message = $"Wave/Order {id} not found." });
            }

            if (order.Status == OutboundOrderStatus.Allocated || order.Status == OutboundOrderStatus.PartiallyAllocated)
            {
                order.UpdateStatus(OutboundOrderStatus.Picking);
            }

            var tasks = await _context.PickTasks
                .Include(pt => pt.OutboundOrderLine)
                .Where(pt => pt.OutboundOrderLine.OutboundOrderId == order.Id && pt.Status == Warehouse.Domain.Entities.PickTaskStatus.Pending)
                .ToListAsync();

            foreach (var task in tasks)
            {
                task.Start(operatorId);
            }

            await _context.SaveChangesAsync(default);
            return Ok(true);
        }
    }

    [HttpPost("waves/{id:guid}/release")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<bool>> ReleaseWave(Guid id)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.ReleaseWave.ReleaseWaveCommand(id);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpGet("waves/{waveId}/pick-tasks")]
    [ProducesResponseType(typeof(List<Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks.PickTaskDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks.PickTaskDto>>> GetOptimizedPickTasks(string waveId)
    {
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var query = new Warehouse.Application.Features.Outbound.Queries.GetOptimizedPickTasks.GetOptimizedPickTasksQuery(waveId, operatorId);
        return ToActionResult(await Mediator.Send(query));
    }

    [HttpPost("orders/{id:guid}/split")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Guid>> SplitOrder(Guid id)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.SplitOrder.SplitOutboundOrderCommand(id, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }

    [HttpPost("waves/{waveId}/put-to-wall")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Warehouse.Application.Features.Outbound.Commands.PutToWall.PutToWallResult>> PutToWall(string waveId, [FromBody] PutToWallRequest request)
    {
        var command = new Warehouse.Application.Features.Outbound.Commands.PutToWall.PutToWallCommand(waveId, request.Sku, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        return ToActionResult(await Mediator.Send(command));
    }
    [HttpPost("waves/{id}/assign")]
    public async Task<IActionResult> AssignWave(string id)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrEmpty(operatorSub)) return Unauthorized();

        var cleanId = id.Trim();
        if (cleanId.StartsWith("OB:", System.StringComparison.OrdinalIgnoreCase))
            cleanId = cleanId[3..];
        else if (cleanId.StartsWith("ORD:", System.StringComparison.OrdinalIgnoreCase))
            cleanId = cleanId[4..];

        if (Guid.TryParse(cleanId, out var waveGuid))
        {
            var result = await Mediator.Send(new Warehouse.Application.Features.Outbound.Commands.AssignWave.AssignWaveCommand(waveGuid, operatorSub));
            if (!result.IsSuccess) return BadRequest(result.Error);
            return Ok();
        }
        else
        {
            // Direct Order Assignment fallback
            var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
            var order = await _context.OutboundOrders
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.OrderNo == cleanId && x.TenantId == tenantId);
            if (order == null)
            {
                return NotFound(new { Message = $"Wave/Order {id} not found." });
            }

            var tasks = await _context.PickTasks
                .Include(pt => pt.OutboundOrderLine)
                .Where(pt => pt.OutboundOrderLine.OutboundOrderId == order.Id && pt.Status == Warehouse.Domain.Entities.PickTaskStatus.Pending)
                .ToListAsync();

            foreach (var task in tasks)
            {
                task.Assign(operatorSub);
            }

            await _context.SaveChangesAsync(default);
            return Ok();
        }
    }

    [HttpPost("pick-tasks/{id}/claim")]
    public async Task<IActionResult> ClaimPickTask(Guid id)
    {
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var command = new Warehouse.Application.Features.Outbound.Commands.AssignPickTask.AssignPickTaskCommand(id, operatorId);
        var result = await Mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(new { Success = true });
    }
}

public record PutToWallRequest(string Sku);

