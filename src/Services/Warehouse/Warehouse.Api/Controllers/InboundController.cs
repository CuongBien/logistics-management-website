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
using Warehouse.Application.Features.Inbound.Commands.ResolveInboundDiscrepancy;
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

        var skuCodes = receipt.Lines.Select(l => l.Sku).Distinct().ToList();
        var skus = await _context.ErpSkuMirrors
            .Where(s => s.TenantId == receipt.TenantId && skuCodes.Contains(s.SkuCode))
            .ToDictionaryAsync(s => s.SkuCode, s => new { s.Name, s.UnitOfMeasure });

        var result = new {
            receipt.Id,
            receipt.ReceiptNo,
            receipt.OrderId,
            receipt.Status,
            receipt.WarehouseId,
            receipt.FinalDestinationWarehouseId,
            receipt.TenantId,
            Lines = receipt.Lines.Select(l => new {
                l.Id,
                l.Sku,
                l.ExpectedQuantity,
                l.ReceivedQuantity,
                ProductName = skus.ContainsKey(l.Sku) ? skus[l.Sku].Name : null,
                UOM = skus.ContainsKey(l.Sku) ? skus[l.Sku].UnitOfMeasure : "PCS"
            }).ToList()
        };

        return Ok(result);
    }

    [HttpGet("receipts")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetReceipts([FromQuery] Guid? warehouseId)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await Mediator.Send(new Warehouse.Application.Features.Inbound.Queries.GetInboundReceiptsList.GetInboundReceiptsListQuery(operatorSub, warehouseId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
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
        if (string.IsNullOrWhiteSpace(operatorId))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

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
            request.Quantity,
            request.LotNo,
            request.ExpiryDate
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

    [HttpGet("discrepancies")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetInboundDiscrepancies([FromQuery] Guid? warehouseId)
    {
        var query = _context.InboundDiscrepancies.AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(d => d.WarehouseId == warehouseId.Value);
        }

        var list = await query
            .AsNoTracking()
            .ToListAsync();
        return Ok(list);
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
    /// Giải quyết biên bản chênh lệch nhập hàng (OS&D)
    /// </summary>
    [HttpPost("discrepancies/{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> ResolveInboundDiscrepancy(
        Guid id, 
        [FromBody] ResolveInboundDiscrepancyRequest request)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(operatorSub))
        {
            return BadRequest(new { Code = "Operator.MissingClaim", Message = "Missing operator claim (sub) in access token." });
        }

        var command = new ResolveInboundDiscrepancyCommand(id, request.NewStatus, operatorSub, request.Notes);
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    [HttpGet("cross-dock-tasks")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> GetCrossDockTasks([FromQuery] string? status, [FromQuery] Guid? warehouseId)
    {
        var tasksQuery = _context.CrossDockTasks.AsQueryable();

        if (warehouseId.HasValue)
        {
            tasksQuery = tasksQuery.Where(t => t.WarehouseId == warehouseId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (Enum.TryParse<CrossDockTaskStatus>(status, true, out var statusEnum))
            {
                tasksQuery = tasksQuery.Where(t => t.Status == statusEnum);
            }
        }

        var tasks = await tasksQuery.AsNoTracking().ToListAsync();

        var receipts = await _context.InboundReceipts.AsNoTracking().ToDictionaryAsync(r => r.Id, r => r.ReceiptNo);
        var orders = await _context.OutboundOrders.AsNoTracking().ToDictionaryAsync(o => o.Id, o => o.OrderNo);
        var bins = await _context.Bins.AsNoTracking().ToDictionaryAsync(b => b.Id, b => new { b.BinCode });

        var list = tasks.Select(t => new {
            Id = t.Id,
            TenantId = t.TenantId,
            InboundReceiptId = receipts.TryGetValue(t.ReceiptId, out var rNo) ? rNo : t.ReceiptId.ToString(),
            OutboundOrderId = orders.TryGetValue(t.OutboundOrderId, out var oNo) ? oNo : t.OutboundOrderId.ToString(),
            Sku = t.Sku,
            Quantity = t.ExpectedQty,
            InboundStagingBinId = t.SourceBinId,
            InboundStagingBinCode = bins.TryGetValue(t.SourceBinId, out var sBin) ? sBin.BinCode : "UNKNOWN",
            OutboundStagingBinId = t.DestinationBinId,
            OutboundStagingBinCode = bins.TryGetValue(t.DestinationBinId, out var dBin) ? dBin.BinCode : "UNKNOWN",
            Status = t.Status.ToString(),
            OperatorId = t.AssignedOperatorId,
            CompletedAt = t.CompletedAt
        }).ToList();

        return Ok(list);
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

    [HttpPost("putaway-tasks/{id}/assign")]
    public async Task<IActionResult> AssignPutawayTask(Guid id)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrEmpty(operatorSub)) return Unauthorized();

        var result = await Mediator.Send(new Warehouse.Application.Features.Inbound.Commands.AssignPutawayTask.AssignPutawayTaskCommand(id, operatorSub));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }
}

public class CompleteCrossDockTaskRequest
{
    public string ScannedDestinationBinCode { get; set; } = default!;
}
