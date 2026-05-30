using Logistics.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Inventory.Commands.ConsumeStock;
using Warehouse.Application.Features.Inventory.Commands.ReleaseStock;
using Warehouse.Application.Features.Inventory.Commands.ReserveStock;
using Warehouse.Application.Features.Inventory.Queries.GetInventoryLedger;
using Warehouse.Application.Features.Inventory.Commands.ReconcileInventory;

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
        var tokenTenant = CurrentUserClaims.GetTenantId(User);
        if (!string.IsNullOrEmpty(tokenTenant))
        {
            command.TenantId = tokenTenant;
        }
        else if (string.IsNullOrEmpty(command.TenantId))
        {
            command.TenantId = "default-tenant";
        }
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

    [HttpGet("{inventoryItemId}/ledger")]
    public async Task<IActionResult> GetLedger(Guid inventoryItemId)
    {
        var result = await _mediator.Send(new GetInventoryLedgerQuery(inventoryItemId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetList()
    {
        var tenantId = CurrentUserClaims.GetTenantId(User);
        // Note: For now we'll get all inventory across warehouses for this tenant
        // A better approach would read the ActiveWarehouseId from headers/claims if passed.
        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Queries.GetInventoryList.GetInventoryListQuery(tenantId, null));
        return Ok(result);
    }

    [HttpGet("by-sku/{sku}")]
    public async Task<IActionResult> GetBySku(string sku)
    {
        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Queries.GetInventoryBySku.GetInventoryBySkuQuery(sku));
        return result.IsSuccess ? Ok(result.Value) : NotFound(new { Message = "Không tìm thấy tồn kho cho SKU này" });
    }

    [HttpPost("reconcile")]
    public async Task<IActionResult> Reconcile([FromBody] ReconcileInventoryCommand command)
    {
        command.OperatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer([FromBody] Warehouse.Application.Features.Inventory.Commands.TransferInventory.TransferInventoryCommand command)
    {
        var tokenTenant = CurrentUserClaims.GetTenantId(User);
        if (!string.IsNullOrEmpty(tokenTenant))
        {
            command.TenantId = tokenTenant;
        }
        else if (string.IsNullOrEmpty(command.TenantId))
        {
            command.TenantId = "default-tenant";
        }

        if (string.IsNullOrEmpty(command.CustomerId))
        {
            command.CustomerId = "cust-default";
        }
        command.OperatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}
