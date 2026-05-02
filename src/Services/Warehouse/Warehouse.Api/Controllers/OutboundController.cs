using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Warehouse.Application.Features.Outbound.Dtos;
using Warehouse.Application.Features.Outbound.Queries.GetOutboundOrderById;
using Warehouse.Api.Controllers.Requests;
using Logistics.Core;

namespace Warehouse.Api.Controllers;

[ApiController]
[Tags("Outbound")]
[Route("api/outbound")]
public class OutboundController : ApiControllerBase
{
    /// <summary>
    /// Tạo phiếu xuất kho (Outbound Order) ở trạng thái Draft — tenant/customer lấy từ JWT.
    /// </summary>
    [HttpPost("orders")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<Guid>> CreateOutboundOrder([FromBody] CreateOutboundOrderRequest request)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var customerId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(customerId))
        {
            return BadRequest(new { Code = "TenantOrCustomer.MissingClaim", Message = "Missing tenant/customer claim in access token." });
        }

        var lineRequests = request.Lines ?? new List<CreateOutboundOrderLineRequest>();
        var lines = lineRequests
            .Select(l => new OutboundOrderLineSpec(l.SkuCode, l.RequestedQty, l.Uom))
            .ToList();

        var command = new CreateOutboundOrderCommand(
            request.OrderId,
            request.DestinationWarehouseId,
            tenantId,
            customerId,
            lines);

        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    /// <summary>
    /// Lấy chi tiết outbound order theo Id (scoped theo tenant trong JWT).
    /// </summary>
    [HttpGet("orders/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OutboundOrderDetailsDto>> GetOutboundOrder(Guid id)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { Code = "Tenant.MissingClaim", Message = "Missing tenant claim in access token." });
        }

        var query = new GetOutboundOrderByIdQuery(id, tenantId);
        var result = await Mediator.Send(query);
        return ToActionResult(result);
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
