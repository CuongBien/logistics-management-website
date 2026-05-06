using Logistics.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Api.Controllers.Requests;

namespace Warehouse.Api.Controllers;

[Route("api/inbound")]
public class InboundController : ApiControllerBase
{
    private readonly IApplicationDbContext _context;

    public InboundController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("receipts/by-order/{orderId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> GetReceiptByOrderId(Guid orderId, [FromQuery] Guid warehouseId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var query = _context.InboundReceipts
            .Include(r => r.Lines)
            .ThenInclude(l => l.Allocations)
            .Where(x => x.OrderId == orderId && x.TenantId == tenantId);
        
        if (warehouseId != Guid.Empty)
        {
            query = query.Where(x => x.WarehouseId == warehouseId);
        }

        var receipt = await query.OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync();

        if (receipt == null) return NotFound(new { Message = $"Inbound receipt for OrderId {orderId} not found." });
        return Ok(receipt);
    }
    /// <summary>
    /// Tạo phiếu nhập kho cho một đơn hàng (Pending)
    /// </summary>
    [HttpPost("receipts")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CreateReceipt([FromBody] CreateInboundReceiptCommand command)
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

    /// <summary>
    /// Nhân viên kho scan item → Gán vào Bin cụ thể và sinh InboundItem
    /// </summary>
    [HttpPut("receipts/{receiptId:guid}/receive")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Receive(Guid receiptId, [FromBody] ReceiveInboundItemRequest request)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(new { Code = "Tenant.MissingClaim", Message = "Missing tenant claim in access token." });
        }
        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

        var command = new ReceiveInboundItemCommand(
            receiptId,
            request.OrderId,
            tenantId,
            request.SkuCode,
            request.BinCode,
            operatorSub,
            request.Quantity
        );

        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    /// <summary>
    /// Đóng cưỡng chế phiếu nhập (dành cho trường hợp giao thiếu hàng)
    /// </summary>
    [HttpPost("receipts/{receiptId:guid}/force-close")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ForceClose(Guid receiptId)
    {
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Claims.Missing", Message = "Missing tenant/operator claims." });
        }

        var command = new Warehouse.Application.Features.Inbound.Commands.ForceCloseReceipt.ForceCloseReceiptCommand(receiptId, tenantId, operatorSub);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }
}
