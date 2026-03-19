using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Ordering.Application.Commands.CreateOrder;
using Ordering.Application.Queries.GetOrderById;
using Logistics.Core;

namespace Ordering.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IMediator mediator, ILogger<OrdersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result<Guid>>> Create(CreateOrderCommand command)
    {
        // Extract the user's ID from the JWT token (Keycloak's 'sub' claim)
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value 
                     ?? "Anonymous";
        
        _logger.LogInformation("Creating order... Token 'sub' claim (userId) = {UserId}", userId);
                     
        // Enforce the user ID as ConsignorId
        var finalCommand = command with { ConsignorId = userId };

        var result = await _mediator.Send(finalCommand);

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
