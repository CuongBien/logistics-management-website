using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Logistics.Core;
using Ordering.Application.Commands.OrderActions;

namespace Ordering.Api.Controllers;

[ApiController]
[Route("api/orders/{orderId}/actions")]
[Authorize]
public class OrderActionsController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrderActionsController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// 👤 Shipper scan barcode → Lấy hàng từ Consignor
    /// </summary>
    [HttpPut("pickup")]
    public async Task<ActionResult<Result>> Pickup(Guid orderId, [FromBody] PickupRequest request)
    {
        var result = await _mediator.Send(new PickupOrderCommand(orderId, request.DriverId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    /// <summary>
    /// 👤 Nhân viên kho scan → Nhận kiện vào kho
    /// </summary>
    [HttpPut("receive")]
    public async Task<ActionResult<Result>> Receive(Guid orderId, [FromBody] ReceiveRequest request)
    {
        var result = await _mediator.Send(new ReceiveOrderCommand(orderId, request.WarehouseId, request.ReceivedBy));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    /// <summary>
    /// 👤 Nhân viên phân loại xong
    /// </summary>
    [HttpPut("sort")]
    public async Task<ActionResult<Result>> Sort(Guid orderId, [FromBody] SortRequest request)
    {
        var result = await _mediator.Send(new SortOrderCommand(orderId, request.DestinationHubId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    /// <summary>
    /// 👤 Quản lý duyệt tuyến + assign tài xế
    /// </summary>
    [HttpPut("dispatch")]
    public async Task<ActionResult<Result>> Dispatch(Guid orderId, [FromBody] DispatchRequest request)
    {
        var result = await _mediator.Send(new DispatchOrderCommand(orderId, request.DriverId, request.RouteId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    /// <summary>
    /// 👤 Tài xế xác nhận giao thành công + upload POD
    /// </summary>
    [HttpPut("deliver")]
    public async Task<ActionResult<Result>> Deliver(Guid orderId, [FromBody] DeliverRequest request)
    {
        var result = await _mediator.Send(new DeliverOrderCommand(orderId, request.ProofOfDeliveryUrl));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    /// <summary>
    /// 👤 Tài xế báo giao thất bại
    /// </summary>
    [HttpPut("fail")]
    public async Task<ActionResult<Result>> FailDelivery(Guid orderId, [FromBody] FailRequest request)
    {
        var result = await _mediator.Send(new FailDeliveryCommand(orderId, request.Reason));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }
}

// --- Request DTOs ---
public record PickupRequest(string DriverId);
public record ReceiveRequest(string WarehouseId, string ReceivedBy);
public record SortRequest(string DestinationHubId);
public record DispatchRequest(string DriverId, string RouteId);
public record DeliverRequest(string ProofOfDeliveryUrl);
public record FailRequest(string Reason);
