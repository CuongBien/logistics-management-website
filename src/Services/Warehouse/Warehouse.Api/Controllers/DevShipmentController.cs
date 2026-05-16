using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Api.Controllers;

[ApiController]
[Route("api/dev/shipments")]
[Microsoft.AspNetCore.Authorization.Authorize]
public class DevShipmentController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public DevShipmentController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost("create-manual")]
    public async Task<IActionResult> CreateManualShipment([FromBody] CreateManualShipmentRequest request)
    {
        var shipment = new Shipment(
            tenantId: "default-tenant",
            customerId: "default-customer",
            shipmentNo: request.ShipmentNo ?? $"MAN-{DateTime.UtcNow:yyyyMMddHHmmss}",
            warehouseId: request.WarehouseId,
            destinationType: DestinationType.Other,
            destinationId: request.DestinationId ?? "MANUAL-DEST"
        );

        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync(HttpContext.RequestAborted);

        return Ok(new { shipment.Id, shipment.ShipmentNo });
    }
}

public class CreateManualShipmentRequest
{
    public Guid WarehouseId { get; set; }
    public string? ShipmentNo { get; set; }
    public string? DestinationId { get; set; }
}
