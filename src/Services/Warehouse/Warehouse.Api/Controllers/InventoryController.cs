using Logistics.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Inventory.Commands.ConsumeStock;
using Warehouse.Application.Features.Inventory.Commands.ReleaseStock;
using Warehouse.Application.Features.Inventory.Commands.ReserveStock;

namespace Warehouse.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly MediatR.IMediator _mediator;

    public InventoryController(MediatR.IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("reserve")]
    public async Task<IActionResult> Reserve([FromBody] ReserveStockCommand command)
    {
        command.TenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        command.OperatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("release")]
    public async Task<IActionResult> Release([FromBody] ReleaseStockCommand command)
    {
        command.OperatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("consume")]
    public async Task<IActionResult> Consume([FromBody] ConsumeStockCommand command)
    {
        command.OperatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
