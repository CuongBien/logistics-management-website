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
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }
}
