using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Api.Controllers.Requests;
using Logistics.Core;
using Warehouse.Domain.Entities;

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

    [HttpGet("orders/{orderId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetOutboundOrder(Guid orderId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var order = await _context.OutboundOrders
            .FirstOrDefaultAsync(x => x.OrderId == orderId && x.TenantId == tenantId);

        if (order == null) return NotFound(new { Message = $"Outbound order for OrderId {orderId} not found." });
        return Ok(order);
    }

    [HttpGet("shipments")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetShipments()
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var shipments = await _context.Shipments
            .Where(x => x.TenantId == tenantId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(50)
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
        var customerId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(customerId))
        {
            return BadRequest(new { Code = "TenantOrCustomer.MissingClaim", Message = "Missing tenant/customer claim in access token." });
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
            customerId,
            sourceShipmentNo);

        var result = await Mediator.Send(finalCommand);
        return ToActionResult(result);
    }

    [HttpPost("orders")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Guid>> CreateOrder([FromBody] CreateOutboundOrderRequest request)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var customerId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var command = new Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder.CreateOutboundOrderCommand(
            tenantId, 
            customerId, 
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

    [HttpGet("orders/{id:guid}/pick-tasks")]
    public async Task<ActionResult<List<PickTask>>> GetPickTasksByOrder(Guid id)
    {
        // Query trực tiếp từ DbContext để đơn giản hóa việc test
        var tasks = await _context.PickTasks
            .Include(pt => pt.OutboundOrderLine)
            .Where(pt => pt.OutboundOrderLine.OutboundOrderId == id)
            .ToListAsync();
            
        return Ok(tasks);
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
}
