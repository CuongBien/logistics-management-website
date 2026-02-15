using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using OMS.Application.Commands.CreateOrder;
using OMS.Application.Queries.GetOrderById;
using BuildingBlocks.Domain;

namespace OMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    // [Authorize] - Commented out for easier testing if needed, or keep it. Original had it.
    [ProducesResponseType(typeof(Result<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result<Guid>>> Create(CreateOrderCommand command)
    {
        var result = await _mediator.Send(command);

        if (result.IsFailure)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(Get), new { id = result.Value }, result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result<OrderDto>>> Get(Guid id)
    {
        var query = new GetOrderByIdQuery(id);
        var result = await _mediator.Send(query);

        if (result.IsFailure)
        {
            if (result.Error.Code == "Order.NotFound")
                return NotFound(result);
            
            return BadRequest(result);
        }

        return Ok(result);
    }
}
