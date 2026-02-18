using Microsoft.AspNetCore.Mvc;
using WMS.Application.Features.Inventory.Commands.CreateInventoryItem;
using WMS.Application.Features.Inventory.Commands.ReserveStock;
using WMS.Application.Features.Inventory.Dtos;
using WMS.Application.Features.Inventory.Queries.GetInventoryBySku;

namespace WMS.Api.Controllers;

public class InventoryController : ApiControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> Create(CreateInventoryItemCommand command)
    {
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    [HttpGet("{sku}")]
    [ProducesResponseType(typeof(InventoryItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InventoryItemDto>> GetBySku(string sku)
    {
        var query = new GetInventoryBySkuQuery(sku);
        var result = await Mediator.Send(query);
        return ToActionResult(result);
    }

    [HttpPost("reserve")]
    [ProducesResponseType(typeof(bool), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<bool>> ReserveStock(ReserveStockCommand command)
    {
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }
}
