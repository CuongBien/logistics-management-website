using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Ordering.Application.Commands.CreateOrder;
using Ordering.Application.Commands.CreateInboundRequest;
using Ordering.Application.Queries.GetOrderById;
using Ordering.Application.Queries.GetOrderStatusHistory;
using Ordering.Application.Queries.GetOrderConsignee;
using Ordering.Application.Queries.GetOrders;
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
        var tenantId = CurrentUserClaims.GetTenantId(User);
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            tenantId = "default-tenant";
        }
        
        _logger.LogInformation("Creating order... userId={UserId}, tenantId={TenantId}", userId, tenantId);
                     
        // Enforce claims as trusted source for tenancy and consignor.
        var finalCommand = command with { ConsignorId = userId, TenantId = tenantId };

        var result = await _mediator.Send(finalCommand);

        if (result.IsFailure)
        {
            return BadRequest(result);
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value }, result);
    }

    [HttpPost("inbound-request")]
    [ProducesResponseType(typeof(Result<Guid>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result<Guid>>> CreateInboundRequest([FromBody] CreateInboundRequestCommand command)
    {
        var userId = CurrentUserClaims.GetCustomerId(User) ?? "Anonymous";
        var tenantId = CurrentUserClaims.GetTenantId(User);
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            tenantId = "default-tenant";
        }

        var finalCommand = command with 
        { 
            TenantId = string.IsNullOrWhiteSpace(command.TenantId) ? tenantId : command.TenantId,
            ConsignorId = string.IsNullOrWhiteSpace(command.ConsignorId) ? userId : command.ConsignorId
        };

        var result = await _mediator.Send(finalCommand);
        return result.IsFailure ? BadRequest(result) : CreatedAtAction(nameof(GetById), new { id = result.Value }, result);
    }

    [HttpGet]
    public async Task<ActionResult<Result<PaginatedList<OrderSummaryDto>>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? tenantId = null,
        [FromQuery] string? consignorId = null,
        [FromQuery] string? status = null,
        [FromQuery] string? type = null,
        [FromQuery] string? fulfillment = null,
        [FromQuery] string? searchTerm = null,
        [FromQuery] string? warehouseId = null)
    {
        // Default to user's tenant if not explicitly requesting another (or if no permission to query others)
        var userTenantId = CurrentUserClaims.GetTenantId(User);
        if (string.IsNullOrWhiteSpace(userTenantId))
        {
            userTenantId = "default-tenant";
        }
        var effectiveTenantId = userTenantId;
        
        var isAdmin = User.IsInRole("Admin");
        var userCustomerId = CurrentUserClaims.GetCustomerId(User);
        
        // If not an admin, they can ONLY see their own orders.
        var effectiveConsignorId = isAdmin ? consignorId : userCustomerId;
        
        _logger.LogInformation("GetOrders: page={Page}, pageSize={PageSize}, tenantId={TenantId}, consignorId={ConsignorId}", page, pageSize, effectiveTenantId, effectiveConsignorId);

        var query = new GetOrdersQuery(page, pageSize, effectiveTenantId, effectiveConsignorId, status, type, fulfillment, searchTerm, warehouseId);
        var result = await _mediator.Send(query);
        
        if (result.IsSuccess) 
        {
            _logger.LogInformation("GetOrders returned {Count} items out of {TotalCount}", result.Value.Items.Count, result.Value.TotalCount);
        }
        else 
        {
            _logger.LogError("GetOrders failed: {Error}", result.Error);
        }

        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(Result<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result<OrderDto>>> GetById(Guid id)
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

    [HttpGet("{id}/consignee")]
    [ProducesResponseType(typeof(Result<OrderConsigneeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result<OrderConsigneeDto>>> GetConsignee(Guid id)
    {
        var result = await _mediator.Send(new GetOrderConsigneeQuery(id));
        if (result.IsFailure)
        {
            if (result.Error.Code == "OrderConsignee.NotFound")
            {
                return NotFound(result);
            }

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
