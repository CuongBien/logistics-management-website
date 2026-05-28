using Logistics.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Application.Features.Inbound.Commands.ReceiveTransitShipment;
using Warehouse.Application.Features.Inbound.Queries.GetTransitDiscrepancies;
using Warehouse.Application.Features.Inbound.Commands.ResolveTransitDiscrepancy;
using Warehouse.Application.Features.Inbound.Commands.CrossDock;
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
        var query = _context.InboundReceipts
            .Include(r => r.Lines)
            .ThenInclude(l => l.Allocations)
            .Where(x => x.OrderId == orderId);
        
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
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var finalCommand = command with { OperatorId = operatorId };
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
    public async Task<ActionResult<ReceiveInboundItemResponse>> Receive(Guid receiptId, [FromBody] ReceiveInboundItemRequest request)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

        var command = new ReceiveInboundItemCommand(
            receiptId,
            request.OrderId,
            "", // TenantId is resolved internally from the receipt in the handler!
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
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claims." });
        }

        var command = new Warehouse.Application.Features.Inbound.Commands.ForceCloseReceipt.ForceCloseReceiptCommand(receiptId, "", operatorSub);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    /// <summary>
    /// Nhận hàng trung chuyển tại kho trung gian (Transit Hub)
    /// </summary>
    [HttpPost("orders/{orderId:guid}/transit-receive")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<bool>> ReceiveTransitShipment(Guid orderId, [FromBody] ReceiveTransitShipmentRequest request)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

        var command = new ReceiveTransitShipmentCommand(orderId, request.WarehouseId, operatorSub, request.ReceivedItems, request.BinCode);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    /// <summary>
    /// Truy vấn danh sách chênh lệch/hao hụt hàng hóa trung chuyển
    /// </summary>
    [HttpGet("transit-discrepancies")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TransitDiscrepancy>>> GetTransitDiscrepancies(
        [FromQuery] Guid? warehouseId,
        [FromQuery] Guid? orderId,
        [FromQuery] Guid? shipmentId,
        [FromQuery] Warehouse.Domain.Enums.TransitDiscrepancyStatus? status)
    {
        var query = new GetTransitDiscrepanciesQuery(warehouseId, orderId, shipmentId, status);
        var result = await Mediator.Send(query);
        return ToActionResult(result);
    }

    /// <summary>
    /// Giải quyết biên bản chênh lệch/hao hụt trung chuyển (Yêu cầu quyền inbound:resolve_discrepancy)
    /// </summary>
    [HttpPost("transit-discrepancies/{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<bool>> ResolveTransitDiscrepancy(
        Guid id, 
        [FromBody] ResolveTransitDiscrepancyRequest request)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

        var command = new ResolveTransitDiscrepancyCommand(id, request.NewStatus, operatorSub, request.Notes);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    /// <summary>
    /// Hoàn tất tác vụ luân chuyển thẳng (Cross-dock)
    /// </summary>
    [HttpPost("cross-dock/{taskId:guid}/complete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> CompleteCrossDockTask(
        Guid taskId, 
        [FromBody] CompleteCrossDockTaskRequest request)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

        var command = new CompleteCrossDockTaskCommand(taskId, operatorSub, request.ScannedDestinationBinCode);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }
}

public class CompleteCrossDockTaskRequest
{
    public string ScannedDestinationBinCode { get; set; } = default!;
}
