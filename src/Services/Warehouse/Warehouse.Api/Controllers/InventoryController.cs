using Logistics.Core;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Inventory.Commands.CreateInventoryItem;
using Warehouse.Application.Features.Inventory.Commands.ReserveStock;
using Warehouse.Application.Features.Inventory.Dtos;
using Warehouse.Application.Features.Inventory.Queries.GetInventoryBySku;

namespace Warehouse.Api.Controllers;

public class InventoryController : ApiControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> Create(CreateInventoryItemCommand command)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var customerId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(customerId))
        {
            return BadRequest(new { Code = "TenantOrCustomer.MissingClaim", Message = "Missing tenant/customer claim in access token." });
        }

        var finalCommand = command with { TenantId = tenantId, CustomerId = customerId };
        var result = await Mediator.Send(finalCommand);
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
