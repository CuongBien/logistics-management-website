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

        // Find warehouse by code, or fallback to WH-CT-001 (Can Tho Warehouse)
        var destCode = msg.DestinationWarehouseCode;
        if (string.IsNullOrWhiteSpace(destCode))
        {
            destCode = "WH-CT-001";
        }
        
        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(x => x.Code == destCode);

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

        // Find warehouse by code
        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(x => x.Code == msg.DestinationWarehouseCode);

        if (warehouse == null)
        {
            _logger.LogError("WMS Inbound Error: Destination warehouse with code '{WarehouseCode}' not found.", msg.DestinationWarehouseCode);
            return;
        }

        var expectedLines = msg.Items?.Select(x => new ExpectedReceiptLine(x.SkuCode, x.Quantity)).ToList() 
                            ?? new System.Collections.Generic.List<ExpectedReceiptLine>();

        var cmd = new CreateInboundReceiptCommand(
            OrderId: msg.OrderId,
            TenantId: msg.TenantId ?? "DefaultTenant",
            CustomerId: msg.ConsignorId,
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

        // Create Outbound Order
        var createOutboundCmd = new CreateOutboundOrderCommand(
            TenantId: msg.TenantId ?? "DefaultTenant",
            CustomerId: msg.ConsignorId,
            WarehouseId: warehouseId,
            OrderId: msg.OrderId,
            OrderNo: msg.WaybillCode,
            DestinationAddress: "Customer Shipping Address",
            DestinationCity: "Customer City",
            Priority: 1,
            AllowPartial: false,
            PlannedShipAt: DateTime.UtcNow.AddDays(1),
            Lines: lines
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
