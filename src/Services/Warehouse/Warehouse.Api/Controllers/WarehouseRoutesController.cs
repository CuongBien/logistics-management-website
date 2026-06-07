using Logistics.Core;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Layout.Queries.GetWarehouseRoutes;
using Warehouse.Application.Features.Layout.Commands.CreateWarehouseRoute;
using Warehouse.Application.Features.Layout.Commands.DeleteWarehouseRoute;

namespace Warehouse.Api.Controllers;

[Route("api/[controller]")]
public class WarehouseRoutesController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<Result<List<WarehouseRouteDto>>>> GetWarehouseRoutes()
    {
        var result = await Mediator.Send(new GetWarehouseRoutesQuery());
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result<Guid>>> CreateWarehouseRoute([FromBody] CreateWarehouseRouteCommand command)
    {
        var result = await Mediator.Send(command);
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result<bool>>> DeleteWarehouseRoute(Guid id)
    {
        var result = await Mediator.Send(new DeleteWarehouseRouteCommand(id));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }
}
