using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Ordering.Application.Commands.CreateOrder;
using Ordering.Application.Queries.GetOrderById;
using Ordering.Application.Queries.GetOrderStatusHistory;
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
        // Keep ConsignorId aligned with SignalR user targeting key (prefer sub claim).
        var userId = CurrentUserClaims.GetCustomerId(User) ?? "Anonymous";
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? string.Empty;

        if (string.IsNullOrWhiteSpace(tenantId))
        {
            return BadRequest(Result<Guid>.Failure(new Error("Tenant.MissingClaim", "Missing tenant claim in access token.")));
        }
        
        _logger.LogInformation("Creating order... userId={UserId}, tenantId={TenantId}", userId, tenantId);
                     
        // Enforce claims as trusted source for tenancy and consignor.
        var finalCommand = command with { ConsignorId = userId, TenantId = tenantId };

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

    [HttpGet("{id}/status-history")]
    [ProducesResponseType(typeof(Result<IReadOnlyCollection<OrderStatusHistoryDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result<IReadOnlyCollection<OrderStatusHistoryDto>>>> GetStatusHistory(Guid id)
    {
        var query = new GetOrderStatusHistoryQuery(id);
        var result = await _mediator.Send(query);
        if (result.IsFailure)
        {
            if (result.Error.Code == "Order.NotFound")
            {
                return NotFound(result);
            }

            return BadRequest(result);
        }

        return Ok(result);
    }
}
