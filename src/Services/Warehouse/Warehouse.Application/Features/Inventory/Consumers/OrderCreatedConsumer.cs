using EventBus.Messages.Events;
using MassTransit;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Inbound.Commands.CreateReceipt;
using Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;
using Warehouse.Application.Features.Outbound.Commands.AllocateStock;

namespace Warehouse.Application.Features.Inventory.Consumers;

/// <summary>
/// WMS Consumer that routes incoming OMS orders to the correct logistics path:
/// 1. InboundRequest: Creates a pending InboundReceipt.
/// 2. Parcel + Warehouse Fulfillment: Automatically creates OutboundOrder and allocates stock.
/// 3. Parcel + Pickup Courier: Standard courier pickup (handled by OMS Saga).
/// </summary>
public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly ILogger<OrderCreatedConsumer> _logger;
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public OrderCreatedConsumer(ILogger<OrderCreatedConsumer> logger, IMediator mediator, IApplicationDbContext context)
    {
        _logger = logger;
        _mediator = mediator;
        _context = context;
    }

    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("WMS: Consuming OrderCreatedIntegrationEvent for Order {OrderId} (Waybill: {WaybillCode}, Type: {OrderType}, Mode: {FulfillmentMode})",
            msg.OrderId, msg.WaybillCode, msg.OrderType, msg.FulfillmentMode);

        if (msg.OrderType == 2) // InboundRequest
        {
            await HandleInboundRequest(msg);
        }
        else if (msg.OrderType == 1 && msg.FulfillmentMode == 2) // Parcel + Warehouse Fulfillment
        {
            await HandleWarehouseFulfillment(msg);
        }
        else if (msg.OrderType == 1 && msg.FulfillmentMode == 1) // Parcel + Pickup (Standard courier)
        {
            await HandleCourierInbound(msg);
        }
    }

    private async Task HandleCourierInbound(OrderCreatedIntegrationEvent msg)
    {
        _logger.LogInformation("WMS: Processing Courier Inbound for Order {OrderId}...", msg.OrderId);

        // Resolve entry point warehouse dynamically:
        // 1. From ConsignorCity
        // 2. From SourceWarehouseCode
        // 3. Fallback to Can Tho (WH-CT-001)
        string? entryCode = null;
        if (!string.IsNullOrWhiteSpace(msg.ConsignorCity))
        {
            var city = msg.ConsignorCity.Trim().ToLowerInvariant();
            if (city.Contains("ho chi minh") || city.Contains("hcm") || city.Contains("sai gon") || city.Contains("sài gòn"))
            {
                entryCode = "WH-SG-002";
            }
            else if (city.Contains("cần thơ") || city.Contains("can tho") || city == "ct")
            {
                entryCode = "WH-CT-001";
            }
            else if (city.Contains("nha trang") || city.Contains("khanh hoa") || city.Contains("khánh hòa"))
            {
                entryCode = "WH-NT-003";
            }
            else if (city.Contains("đà nẵng") || city.Contains("da nang") || city == "dn")
            {
                entryCode = "WH-DN-004";
            }
            else if (city.Contains("vinh") || city.Contains("nghệ an") || city.Contains("nghe an"))
            {
                entryCode = "WH-V-005";
            }
            else if (city.Contains("hà nội") || city.Contains("ha noi") || city.Contains("hanoi") || city == "hn")
            {
                entryCode = "WH-HN-006";
            }
            else if (city.Contains("hải phòng") || city.Contains("hai phong") || city == "hp")
            {
                entryCode = "WH-HP-007";
            }
            
            _logger.LogInformation("WMS: Resolved entry warehouse code '{EntryCode}' from ConsignorCity '{ConsignorCity}'", entryCode, msg.ConsignorCity);
        }

        if (string.IsNullOrEmpty(entryCode) && !string.IsNullOrWhiteSpace(msg.SourceWarehouseCode))
        {
            entryCode = msg.SourceWarehouseCode;
            _logger.LogInformation("WMS: Resolved entry warehouse code '{EntryCode}' from SourceWarehouseCode", entryCode);
        }

        if (string.IsNullOrEmpty(entryCode))
        {
            entryCode = "WH-CT-001";
            _logger.LogInformation("WMS: Falling back to default entry warehouse code 'WH-CT-001'");
        }
        
        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(x => x.Code == entryCode);

        if (warehouse == null)
        {
            // fallback to any first warehouse
            warehouse = await _context.Warehouses.FirstOrDefaultAsync();
            if (warehouse == null)
            {
                _logger.LogError("WMS Inbound Error: No warehouses found in database.");
                return;
            }
        }

        var expectedLines = msg.Items?.Select(x => new ExpectedReceiptLine(x.SkuCode, x.Quantity)).ToList() 
                            ?? new System.Collections.Generic.List<ExpectedReceiptLine>();

        var cmd = new CreateInboundReceiptCommand(
            OrderId: msg.OrderId,
            TenantId: msg.TenantId ?? "DefaultTenant",
            CustomerId: msg.ConsignorId ?? "DefaultCustomer",
            OperatorId: "System",
            WarehouseId: warehouse.Id,
            SourceShipmentNo: $"ASN-{msg.WaybillCode}",
            ExpectedLines: expectedLines
        );

        var result = await _mediator.Send(cmd);
        if (result.IsFailure)
        {
            _logger.LogError("WMS Inbound Error: Failed to create InboundReceipt for courier order. Error: {Error}", result.Error.Message);
        }
        else
        {
            _logger.LogInformation("WMS: Automatically created InboundReceipt {ReceiptId} for courier order {OrderId}.", result.Value, msg.OrderId);
        }
    }

    private async Task HandleInboundRequest(OrderCreatedIntegrationEvent msg)
    {
        _logger.LogInformation("WMS: Processing InboundRequest for Order {OrderId}...", msg.OrderId);

        // Find warehouse by code (Prioritize SourceWarehouseCode for Cross-region Consignment)
        var targetWarehouseCode = !string.IsNullOrWhiteSpace(msg.SourceWarehouseCode) 
            ? msg.SourceWarehouseCode 
            : msg.DestinationWarehouseCode;

        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(x => x.Code == targetWarehouseCode);

        if (warehouse == null)
        {
            _logger.LogError("WMS Inbound Error: Target warehouse with code '{WarehouseCode}' not found.", targetWarehouseCode);
            return;
        }

        var expectedLines = msg.Items?.Select(x => new ExpectedReceiptLine(x.SkuCode, x.Quantity)).ToList() 
                            ?? new System.Collections.Generic.List<ExpectedReceiptLine>();

        var cmd = new CreateInboundReceiptCommand(
            OrderId: msg.OrderId,
            TenantId: msg.TenantId ?? "DefaultTenant",
            CustomerId: msg.ConsignorId ?? "DefaultCustomer",
            OperatorId: "System",
            WarehouseId: warehouse.Id,
            SourceShipmentNo: $"ASN-{msg.WaybillCode}",
            ExpectedLines: expectedLines
        );

        var result = await _mediator.Send(cmd);
        if (result.IsFailure)
        {
            _logger.LogError("WMS Inbound Error: Failed to create InboundReceipt. Error: {Error}", result.Error.Message);
        }
        else
        {
            _logger.LogInformation("WMS: Automatically created InboundReceipt {ReceiptId} for order {OrderId}.", result.Value, msg.OrderId);

            // Cross-region consignment: store the final destination on the receipt
            // so the Sort handler can auto-resolve it later without the client hardcoding it.
            if (!string.IsNullOrWhiteSpace(msg.SourceWarehouseCode) 
                && !string.IsNullOrWhiteSpace(msg.DestinationWarehouseCode)
                && !string.Equals(msg.SourceWarehouseCode, msg.DestinationWarehouseCode, StringComparison.OrdinalIgnoreCase))
            {
                var destWarehouse = await _context.Warehouses
                    .FirstOrDefaultAsync(x => x.Code == msg.DestinationWarehouseCode);

                if (destWarehouse != null)
                {
                    var receipt = await _context.InboundReceipts
                        .FirstOrDefaultAsync(r => r.Id == result.Value);

                    if (receipt != null)
                    {
                        receipt.SetFinalDestination(destWarehouse.Id);
                        await _context.SaveChangesAsync(default);
                        _logger.LogInformation(
                            "WMS: Cross-region consignment detected. Stored FinalDestinationWarehouseId={DestId} (Code={DestCode}) on InboundReceipt {ReceiptId}.",
                            destWarehouse.Id, destWarehouse.Code, result.Value);
                    }
                }
                else
                {
                    _logger.LogWarning("WMS: Destination warehouse '{DestCode}' not found. Cannot store FinalDestinationWarehouseId.", msg.DestinationWarehouseCode);
                }
            }
        }
    }

    private async Task HandleWarehouseFulfillment(OrderCreatedIntegrationEvent msg)
    {
        _logger.LogInformation("WMS: Processing Warehouse Fulfillment for Order {OrderId}...", msg.OrderId);

        if (msg.Items == null || !msg.Items.Any())
        {
            _logger.LogWarning("WMS Fulfillment Warning: Order {OrderId} has no items. Skipping fulfillment.", msg.OrderId);
            return;
        }

        // Find warehouse that has the stock for the first SKU
        var firstSku = msg.Items.First().SkuCode;
        var warehouseId = await _context.InventoryItems
            .Where(x => x.TenantId == (msg.TenantId ?? "DefaultTenant") && x.Sku == firstSku && x.QuantityOnHand > 0)
            .Select(x => x.WarehouseId)
            .FirstOrDefaultAsync();

        if (warehouseId == Guid.Empty)
        {
            // Fallback to first available warehouse
            var fallbackWarehouse = await _context.Warehouses.FirstOrDefaultAsync();
            if (fallbackWarehouse == null)
            {
                _logger.LogError("WMS Fulfillment Error: No warehouses found in database.");
                return;
            }
            warehouseId = fallbackWarehouse.Id;
            _logger.LogWarning("WMS Fulfillment Warning: No stock found for SKU '{Sku}'. Falling back to warehouse '{Warehouse}'", firstSku, fallbackWarehouse.Code);
        }

        var lines = msg.Items.Select(x => new OutboundOrderLineItem(x.SkuCode, x.Quantity, "PCS")).ToList();

        // Resolve Destination Warehouse Details if provided
        var destAddress = "Customer Shipping Address";
        var destCity = "Customer City";
        string? partnerId = null;
        double? latitude = null;
        double? longitude = null;

        if (!string.IsNullOrWhiteSpace(msg.DestinationWarehouseCode))
        {
            var destWh = await _context.Warehouses
                .FirstOrDefaultAsync(w => w.Code == msg.DestinationWarehouseCode);

            if (destWh != null)
            {
                destAddress = destWh.Name;
                destCity = destWh.Code;
                partnerId = destWh.Code;
                latitude = destWh.Latitude;
                longitude = destWh.Longitude;
            }
        }

        // Create Outbound Order
        var createOutboundCmd = new CreateOutboundOrderCommand(
            TenantId: msg.TenantId ?? "DefaultTenant",
            CustomerId: string.IsNullOrWhiteSpace(msg.ConsignorId) ? "cust-default" : msg.ConsignorId,
            OperatorId: "System",
            WarehouseId: warehouseId,
            OrderId: msg.OrderId,
            OrderNo: msg.WaybillCode,
            DestinationAddress: destAddress,
            DestinationCity: destCity,
            Priority: 1,
            AllowPartial: false,
            PlannedShipAt: DateTime.UtcNow.AddDays(1),
            Lines: lines,
            PartnerId: partnerId,
            Latitude: latitude,
            Longitude: longitude
        );

        var outboundResult = await _mediator.Send(createOutboundCmd);
        if (outboundResult.IsFailure)
        {
            _logger.LogError("WMS Fulfillment Error: Failed to create OutboundOrder for Order {OrderId}. Error: {Error}", msg.OrderId, outboundResult.Error.Message);
            return;
        }

        var outboundOrderId = outboundResult.Value;
        _logger.LogInformation("WMS: Automatically created OutboundOrder {OutboundOrderId} for order {OrderId}.", outboundOrderId, msg.OrderId);

        // Allocate Stock
        var allocateCmd = new AllocateStockCommand(outboundOrderId, "System");
        var allocateResult = await _mediator.Send(allocateCmd);
        if (allocateResult.IsFailure)
        {
            _logger.LogError("WMS Fulfillment Error: Failed to allocate stock for OutboundOrder {OutboundOrderId}. Error: {Error}", outboundOrderId, allocateResult.Error.Message);
        }
        else
        {
            _logger.LogInformation("WMS: Automatically allocated stock for OutboundOrder {OutboundOrderId}.", outboundOrderId);
        }
    }
}
