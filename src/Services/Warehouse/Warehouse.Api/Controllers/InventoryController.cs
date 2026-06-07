using Logistics.Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Inventory.Commands.ConsumeStock;
using Warehouse.Application.Features.Inventory.Commands.ReleaseStock;
using Warehouse.Application.Features.Inventory.Commands.ReserveStock;
using Warehouse.Application.Features.Inventory.Queries.GetInventoryLedger;
using Warehouse.Application.Features.Inventory.Commands.ReconcileInventory;
using Warehouse.Application.Features.Inventory.Queries.GetReconciliationReports;
using Warehouse.Application.Features.Inventory.Commands.ResolveReconciliationReport;
using Warehouse.Application.Features.Inventory.Commands.IgnoreReconciliationReport;

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

    [HttpGet("ledger")]
    public async Task<IActionResult> GetGlobalLedger([FromQuery] Guid? warehouseId, [FromQuery] string? sku)
    {
        var result = await _mediator.Send(new GetGlobalInventoryLedgerQuery(warehouseId, sku));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] Guid? warehouseId, [FromQuery] Guid? binId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User);
        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Queries.GetInventoryList.GetInventoryListQuery(tenantId, warehouseId, binId));
        return Ok(result);
    }

    [HttpGet("skus")]
    public async Task<IActionResult> GetSkus()
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? CurrentUserClaims.GetCustomerId(User);
        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Queries.GetSkus.GetSkusQuery(tenantId));
        return Ok(result);
    }

    [HttpPost("skus")]
    public async Task<IActionResult> CreateSku([FromBody] Warehouse.Application.Features.Inventory.Commands.CreateSku.CreateSkuCommand command)
    {
        var tokenTenant = CurrentUserClaims.GetTenantId(User) ?? CurrentUserClaims.GetCustomerId(User);
        if (!string.IsNullOrEmpty(tokenTenant))
        {
            command.TenantId = tokenTenant;
        }
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("skus/{skuCode}")]
    public async Task<IActionResult> DeleteSku(string skuCode)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? CurrentUserClaims.GetCustomerId(User) ?? "tenant-1";
        
        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Commands.DeleteSku.DeleteSkuCommand(skuCode, tenantId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
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

    [HttpGet("reconciliation-reports")]
    public async Task<IActionResult> GetReconciliationReports([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetReconciliationReportsQuery(warehouseId));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("reconciliation-reports/{id:guid}/resolve")]
    public async Task<IActionResult> ResolveReconciliation(Guid id, [FromBody] ResolveReconciliationRequest request)
    {
        var result = await _mediator.Send(new ResolveReconciliationReportCommand(id, request.Notes));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }

    [HttpPost("reconciliation-reports/{id:guid}/ignore")]
    public async Task<IActionResult> IgnoreReconciliation(Guid id, [FromBody] ResolveReconciliationRequest request)
    {
        var result = await _mediator.Send(new IgnoreReconciliationReportCommand(id, request.Notes));
        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
}

public record ResolveReconciliationRequest(string Notes);
