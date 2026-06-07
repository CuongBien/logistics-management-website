using Logistics.Core;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Warehouse.Application.Features.Dashboard.Queries.GetWarehouseCapacity;
using Warehouse.Application.Features.Dashboard.Queries.GetInventoryStats;
using Warehouse.Application.Features.Dashboard.Queries.GetPendingWorkloads;
using Warehouse.Application.Features.Dashboard.Queries.GetDiscrepanciesStats;
using Warehouse.Application.Features.Dashboard.Queries.GetOperatorProductivity;
using Warehouse.Application.Features.Dashboard.Queries.GetTopMovingSkus;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Admin only, but role config depends on Identity setup
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("capacity")]
    public async Task<ActionResult<Result<WarehouseCapacityDto>>> GetCapacity([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetWarehouseCapacityQuery(warehouseId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("inventory")]
    public async Task<ActionResult<Result<InventoryStatsDto>>> GetInventoryStats([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetInventoryStatsQuery(warehouseId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("workloads")]
    public async Task<ActionResult<Result<PendingWorkloadsDto>>> GetWorkloads([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetPendingWorkloadsQuery(warehouseId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("discrepancies")]
    public async Task<ActionResult<Result<DiscrepanciesStatsDto>>> GetDiscrepancies([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetDiscrepanciesStatsQuery(warehouseId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("operator-productivity")]
    public async Task<ActionResult<Result<List<OperatorProductivityDto>>>> GetOperatorProductivity([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetOperatorProductivityQuery(warehouseId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }

    [HttpGet("top-skus")]
    public async Task<ActionResult<Result<List<TopMovingSkuDto>>>> GetTopMovingSkus([FromQuery] Guid? warehouseId)
    {
        var result = await _mediator.Send(new GetTopMovingSkusQuery(warehouseId));
        return result.IsFailure ? BadRequest(result) : Ok(result);
    }
}
