using Logistics.Core;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Ordering.Application.Queries.GetOrderStatusSummary;
using Ordering.Application.Queries.GetFinancialStats;

namespace Ordering.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private string? GetTenantIdIfApplicable()
    {
        // For example, if user is not Admin, restrict to their own tenant
        var isAdmin = User.IsInRole("Admin");
        if (isAdmin)
        {
            return null; // Query globally
        }

        var tenantId = User.Claims.FirstOrDefault(c => c.Type == "tenant")?.Value;
        return tenantId;
    }

    [HttpGet("status-summary")]
    public async Task<ActionResult<Result<OrderStatusSummaryDto>>> GetStatusSummary()
    {
        var tenantId = GetTenantIdIfApplicable();
        var result = await _mediator.Send(new GetOrderStatusSummaryQuery(tenantId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("financials")]
    public async Task<ActionResult<Result<FinancialStatsDto>>> GetFinancials()
    {
        var tenantId = GetTenantIdIfApplicable();
        var result = await _mediator.Send(new GetFinancialStatsQuery(tenantId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }
}
