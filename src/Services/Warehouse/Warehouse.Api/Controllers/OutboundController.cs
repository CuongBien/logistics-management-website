using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Api.Controllers.Requests;
using Logistics.Core;

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
}
