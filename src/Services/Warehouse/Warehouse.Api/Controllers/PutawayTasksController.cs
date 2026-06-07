using MediatR;
using Microsoft.AspNetCore.Mvc;
using Logistics.Core;
using Warehouse.Application.Features.Inbound.Commands.Putaway;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/inbound/putaway-tasks")]
public class PutawayTasksController : ControllerBase
{
    private readonly IMediator _mediator;

    public PutawayTasksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPutawayTasks([FromQuery] Guid? warehouseId)
    {
        var operatorSub = Logistics.Core.CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        Console.WriteLine($"[PutawayTasksController] GetPutawayTasks called. Sub: '{operatorSub}'");
        
        var query = new Warehouse.Application.Features.Inbound.Queries.GetPutawayTasksList.GetPutawayTasksListQuery(operatorSub, warehouseId);
        var result = await _mediator.Send(query);
        
        if (result.IsSuccess)
        {
            Console.WriteLine($"[PutawayTasksController] Returning {result.Value?.Count ?? 0} tasks.");
        }
        
        if (!result.IsSuccess)
        {
            return BadRequest(new { Error = result.Error.Code, Message = result.Error.Message });
        }

        return Ok(result.Value);
    }

    [HttpPost("{taskId}/complete")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CompleteTask(Guid taskId, [FromBody] CompletePutawayTaskRequest request)
    {
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        
        var command = new CompletePutawayTaskCommand(
            taskId,
            request.ScannedDestinationBinCode,
            operatorId
        );

        var result = await _mediator.Send(command);

        if (!result.IsSuccess)
        {
            return BadRequest(new { Error = result.Error.Code, Message = result.Error.Message });
        }

        return Ok(new { Success = true });
    }
}

public class CompletePutawayTaskRequest
{
    public string ScannedDestinationBinCode { get; set; } = default!;
}
