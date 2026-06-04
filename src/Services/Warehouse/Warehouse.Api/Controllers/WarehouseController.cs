using Logistics.Core;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Application.Features.Layout.Commands.CreateBin;
using Warehouse.Application.Features.Layout.Commands.CreateBlock;
using Warehouse.Application.Features.Layout.Commands.CreateWarehouse;
using Warehouse.Application.Features.Layout.Commands.CreateZone;
using Warehouse.Application.Features.Layout.Commands.UpdateBinStatus;
using Warehouse.Application.Features.Layout.Queries;
using Warehouse.Application.Features.Layout.Queries.ScanBinDetail;
using Warehouse.Domain.Enums;

namespace Warehouse.Api.Controllers;

[Route("api/[controller]")]
public class WarehouseController : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetWarehouses([FromQuery] bool all = false)
    {
        var operatorSub = all ? string.Empty : (CurrentUserClaims.GetCustomerId(User) ?? string.Empty);
        var result = await Mediator.Send(new GetWarehousesQuery(operatorSub));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id}/hierarchy")]
    public async Task<IActionResult> GetHierarchy(Guid id)
    {
        var result = await Mediator.Send(new GetWarehouseHierarchyQuery(id));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> CreateWarehouse(CreateWarehouseCommand command)
    {
        var result = await Mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id}/blocks")]
    public async Task<IActionResult> CreateBlock(Guid id, [FromBody] CreateBlockRequest request)
    {
        var result = await Mediator.Send(new CreateBlockCommand(id, request.BlockCode));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("blocks/{id}/zones")]
    public async Task<IActionResult> CreateZone(Guid id, [FromBody] CreateZoneRequest request)
    {
        var result = await Mediator.Send(new CreateZoneCommand(id, request.ZoneType));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("zones/{id}/bins")]
    public async Task<IActionResult> CreateBin(Guid id, [FromBody] CreateBinRequest request)
    {
        var result = await Mediator.Send(new CreateBinCommand(request.WarehouseId, id, request.BinCode, request.Aisle, request.Rack, request.Shelf, request.PickSequence));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("bins/{id}/status")]
    public async Task<IActionResult> UpdateBinStatus(Guid id, [FromBody] UpdateBinStatusRequest request)
    {
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? string.Empty;
        var result = await Mediator.Send(new UpdateBinStatusCommand(id, request.NewStatus, operatorSub));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>
    /// Tra cứu thông tin chi tiết ô kệ qua mã QR - nhân viên quét mã QR ô kệ
    /// </summary>
    [HttpGet("{warehouseId}/bins/scan")]
    public async Task<IActionResult> ScanBinDetail(Guid warehouseId, [FromQuery] string binCode)
    {
        var query = new ScanBinDetailQuery(binCode, warehouseId);
        var result = await Mediator.Send(query);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { Error = result.Error.Code, Message = result.Error.Message });
    }
}

public record CreateBinRequest(Guid WarehouseId, string BinCode, string? Aisle = null, string? Rack = null, string? Shelf = null, int PickSequence = 0);
public record UpdateBinStatusRequest(BinStatus NewStatus);
public record CreateBlockRequest(string BlockCode);
public record CreateZoneRequest(ZoneType ZoneType);
