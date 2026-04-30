using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Logistics.Core;

namespace Warehouse.Api.Controllers;

[ApiController]
[Tags("Outbound")]
[Route("api/outbound")]
public class OutboundController : ApiControllerBase
{
    [HttpPut("sort")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SortOrder(SortOrderCommand command)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var customerId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(customerId))
        {
            return BadRequest(new { Code = "TenantOrCustomer.MissingClaim", Message = "Missing tenant/customer claim in access token." });
        }

        var sourceShipmentNo = command.SourceShipmentNo;
        if (string.IsNullOrWhiteSpace(sourceShipmentNo))
        {
            sourceShipmentNo = $"ASN-{command.OrderId:N}";
        }

        var finalCommand = command with
        {
            TenantId = tenantId,
            CustomerId = customerId,
            SourceShipmentNo = sourceShipmentNo
        };

        var result = await Mediator.Send(finalCommand);
        return ToActionResult(result);
    }
}
