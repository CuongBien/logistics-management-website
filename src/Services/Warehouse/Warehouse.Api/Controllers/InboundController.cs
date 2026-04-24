using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Inbound.Commands.ReceiveReceipt;

namespace Warehouse.Api.Controllers;

[Route("api/inbound")]
public class InboundController : ApiControllerBase
{
    /// <summary>
    /// Tạo phiếu nhập kho cho một đơn hàng (Pending)
    /// </summary>
    [HttpPost("receipts")]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Guid>> CreateReceipt([FromBody] CreateInboundReceiptCommand command)
    {
        var result = await Mediator.Send(command);
        return ToActionResult(result);
    }

    /// <summary>
    /// Nhân viên kho scan → Xác nhận hàng đã vào kho (Pending → Received)
    /// </summary>
    [HttpPut("receipts/{receiptId:guid}/receive")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Receive(Guid receiptId)
    {
        var result = await Mediator.Send(new ReceiveInboundReceiptCommand(receiptId));
        return ToActionResult(result);
    }
}
