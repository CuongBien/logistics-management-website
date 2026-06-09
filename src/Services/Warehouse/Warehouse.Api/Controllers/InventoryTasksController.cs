using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Inventory.Commands.CycleCount;
using Warehouse.Application.Features.Inventory.Commands.Replenishment;
using Warehouse.Application.Features.Inventory.Commands.VerifyCycleCount;
using Warehouse.Application.Features.Inventory.Commands.StartReplenishment;
using Warehouse.Application.Features.Inventory.Commands.StartCycleCount;
using Logistics.Core;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/inventory/tasks")]
[Authorize]
public class InventoryTasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public InventoryTasksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("cycle-count")]
    public async Task<IActionResult> GetCycleCountTasks([FromQuery] Guid? warehouseId, [FromQuery] bool? assignedToMe, [FromQuery] bool? unassigned)
    {
        var operatorSub = Logistics.Core.CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var query = new Warehouse.Application.Features.Inventory.Queries.GetCycleCountTasksList.GetCycleCountTasksListQuery(operatorSub, warehouseId, assignedToMe, unassigned);
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpGet("replenish")]
    public async Task<IActionResult> GetReplenishmentTasks([FromQuery] Guid? warehouseId, [FromQuery] bool? assignedToMe, [FromQuery] bool? unassigned)
    {
        var operatorSub = Logistics.Core.CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var query = new Warehouse.Application.Features.Inventory.Queries.GetReplenishmentTasksList.GetReplenishmentTasksListQuery(operatorSub, warehouseId, assignedToMe, unassigned);
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpPost("cycle-count/generate")]
    public async Task<IActionResult> GenerateCountTasks([FromQuery] string tenantId, [FromQuery] Guid warehouseId, [FromQuery] int maxTasks = 10)
    {
        var command = new CreateCountTasksCommand(tenantId, warehouseId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty, maxTasks);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpPost("cycle-count/{taskId:guid}/start")]
    public async Task<IActionResult> StartCountTask(Guid taskId)
    {
        var command = new StartCycleCountCommand(taskId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok();
    }

    [HttpPost("cycle-count/{taskId:guid}/submit")]
    public async Task<IActionResult> SubmitCountResult(Guid taskId, [FromBody] SubmitCountRequest request)
    {
        var command = new SubmitCountResultCommand(taskId, request.CountedQty, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok();
    }

    [HttpPost("cycle-count/{taskId:guid}/approve")]
    public async Task<IActionResult> ApproveCountAdjustment(Guid taskId)
    {
        var command = new ApproveCountAdjustmentCommand(taskId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok();
    }

    [HttpPost("replenish/generate")]
    public async Task<IActionResult> GenerateReplenishmentTasks([FromQuery] string tenantId, [FromQuery] Guid warehouseId)
    {
        var command = new GenerateReplenishmentTasksCommand(tenantId, warehouseId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok(result.Value);
    }

    [HttpPost("replenish/{taskId:guid}/start")]
    public async Task<IActionResult> StartReplenishmentTask(Guid taskId)
    {
        var command = new StartReplenishmentCommand(taskId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok();
    }

    [HttpPost("replenish/{taskId:guid}/complete")]
    public async Task<IActionResult> CompleteReplenishmentTask(Guid taskId)
    {
        var command = new CompleteReplenishmentTaskCommand(taskId, CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess)
            return BadRequest(result.Error);

        return Ok();
    }

    /// <summary>
    /// Xác thực kiểm kê ô kệ bằng QR - nhân viên quét mã từng sản phẩm trong kệ
    /// </summary>
    [HttpPost("cycle-counts/verify")]
    public async Task<IActionResult> VerifyCycleCount([FromBody] VerifyCycleCountRequest request)
    {
        var operatorId = Logistics.Core.CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var command = new VerifyCycleCountCommand(request.BinCode, request.WarehouseId, request.ScannedItems, operatorId);
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { Error = result.Error.Code, Message = result.Error.Message });
    }

    [HttpPost("cycle-count/{id}/assign")]
    public async Task<IActionResult> AssignCycleCount(Guid id)
    {
        var operatorSub = Logistics.Core.CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrEmpty(operatorSub)) return Unauthorized();

        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Commands.AssignCycleCount.AssignCycleCountCommand(id, operatorSub));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpPost("replenishments/{id}/assign")]
    public async Task<IActionResult> AssignReplenishment(Guid id)
    {
        var operatorSub = Logistics.Core.CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        if (string.IsNullOrEmpty(operatorSub)) return Unauthorized();

        var result = await _mediator.Send(new Warehouse.Application.Features.Inventory.Commands.AssignReplenishment.AssignReplenishmentCommand(id, operatorSub));
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok();
    }

    [HttpPost("replenish/{id}/claim")]
    public async Task<IActionResult> ClaimReplenishTask(Guid id)
    {
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var command = new Warehouse.Application.Features.Inventory.Commands.AssignReplenishment.AssignReplenishmentCommand(id, operatorId);
        var result = await _mediator.Send(command);
        if (!result.IsSuccess) return BadRequest(result.Error);
        return Ok(new { Success = true });
    }
}

public class SubmitCountRequest
{
    public int CountedQty { get; set; }
}

public class VerifyCycleCountRequest
{
    public string BinCode { get; set; } = default!;
    public Guid WarehouseId { get; set; }
    public List<ScannedItemDto> ScannedItems { get; set; } = new();
}

