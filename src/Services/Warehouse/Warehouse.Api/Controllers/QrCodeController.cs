using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Logistics.Core;
using Warehouse.Application.Common;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;
using Warehouse.Application.Features.Inbound.Commands.Putaway;
using Warehouse.Application.Features.Inbound.Commands.CrossDock;
using Warehouse.Application.Features.Inbound.Commands.ReceiveTransitShipment;
using Warehouse.Application.Features.Outbound.Commands.PickStock;
using Warehouse.Application.Features.Outbound.Commands.SortOrder;
using Warehouse.Application.Features.Outbound.Commands.ShipOrder;
using Warehouse.Domain.Enums;

namespace Warehouse.Api.Controllers;

/// <summary>
/// Controller tập trung toàn bộ nghiệp vụ QR Code cho WMS.
/// Nhóm A (7): Sinh mã — Nhóm B (5): Giải mã & Tra cứu — Nhóm C (11): Thao tác
/// </summary>
[ApiController]
[Tags("QR Code")]
[Route("api/qrcode")]
public class QrCodeController : ApiControllerBase
{
    private readonly IQrCodeService _qrCodeService;
    private readonly IApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;

    public QrCodeController(
        IQrCodeService qrCodeService,
        IApplicationDbContext context,
        IInventoryService inventoryService)
    {
        _qrCodeService = qrCodeService;
        _context = context;
        _inventoryService = inventoryService;
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║                NHÓM A — SINH MÃ QR (7 endpoint)                ║
    // ╚══════════════════════════════════════════════════════════════════╝

    /// <summary>A1: Sinh QR cho ô kệ — in tem dán lên kệ vật lý</summary>
    [HttpGet("bin/{binId:guid}")]
    public async Task<IActionResult> GetBinQr(Guid binId)
    {
        var bin = await _context.Bins.AsNoTracking().FirstOrDefaultAsync(b => b.Id == binId);
        if (bin == null) return NotFound(Err("QR.EntityNotFound", $"Bin {binId} không tồn tại."));
        return QrPng(QrPayloadFormat.ForBin(bin.BinCode), $"bin-{bin.BinCode}.png");
    }

    /// <summary>A2: Sinh QR hàng loạt cho tất cả ô kệ trong 1 kho</summary>
    [HttpGet("warehouse/{warehouseId:guid}/bins/batch")]
    public async Task<IActionResult> GetBinsBatch(Guid warehouseId)
    {
        var bins = await _context.Bins
            .Where(b => b.WarehouseId == warehouseId && !b.IsDeleted)
            .AsNoTracking().ToListAsync();

        var result = bins.Select(b =>
        {
            var payload = QrPayloadFormat.ForBin(b.BinCode);
            return new { b.Id, b.BinCode, Payload = payload, QrBase64 = ToBase64(payload) };
        });
        return Ok(result);
    }

    /// <summary>A3: Sinh QR cho đơn vận chuyển (courier) — in tem vận đơn</summary>
    [HttpGet("order/{orderId:guid}")]
    public async Task<IActionResult> GetOrderQr(Guid orderId)
    {
        // orderId = OMS OrderId, tìm OutboundOrder.OrderId
        var order = await _context.OutboundOrders.AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderId == orderId || o.Id == orderId);
        if (order == null) return NotFound(Err("QR.EntityNotFound", $"Order {orderId} không tồn tại."));
        return QrPng(QrPayloadFormat.ForOrder(order.OrderNo), $"order-{order.OrderNo}.png");
    }

    /// <summary>A4: Sinh QR cho đơn xuất kho WMS — in tem thùng carton sau Pack</summary>
    [HttpGet("outbound-order/{id:guid}")]
    public async Task<IActionResult> GetOutboundOrderQr(Guid id)
    {
        var order = await _context.OutboundOrders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(Err("QR.EntityNotFound", $"OutboundOrder {id} không tồn tại."));
        return QrPng(QrPayloadFormat.ForOutboundOrder(order.OrderNo), $"ob-{order.OrderNo}.png");
    }

    /// <summary>A5: Sinh QR cho lô hàng — dán tem lên pallet/xe</summary>
    [HttpGet("shipment/{shipmentId:guid}")]
    public async Task<IActionResult> GetShipmentQr(Guid shipmentId)
    {
        var s = await _context.Shipments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == shipmentId);
        if (s == null) return NotFound(Err("QR.EntityNotFound", $"Shipment {shipmentId} không tồn tại."));
        return QrPng(QrPayloadFormat.ForShipment(s.ShipmentNo), $"shp-{s.ShipmentNo}.png");
    }

    /// <summary>A6: Sinh QR cho phiếu nhập — in kèm lô hàng đến</summary>
    [HttpGet("receipt/{receiptId:guid}")]
    public async Task<IActionResult> GetReceiptQr(Guid receiptId)
    {
        var r = await _context.InboundReceipts.AsNoTracking().FirstOrDefaultAsync(x => x.Id == receiptId);
        if (r == null) return NotFound(Err("QR.EntityNotFound", $"Receipt {receiptId} không tồn tại."));
        return QrPng(QrPayloadFormat.ForReceipt(r.ReceiptNo), $"rcv-{r.ReceiptNo}.png");
    }

    /// <summary>A7: Sinh QR cho SKU — sản phẩm không có barcode sẵn</summary>
    [HttpGet("sku/{skuCode}")]
    public IActionResult GetSkuQr(string skuCode)
        => QrPng(QrPayloadFormat.ForSku(skuCode), $"sku-{skuCode}.png");

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║             NHÓM B — GIẢI MÃ & TRA CỨU (5 endpoint)           ║
    // ╚══════════════════════════════════════════════════════════════════╝

    /// <summary>B1: Parse mã QR — API trung tâm, nhận chuỗi thô → trả type + data enriched</summary>
    [HttpPost("parse")]
    public async Task<IActionResult> Parse([FromBody] ParseRequest req)
    {
        var qr = QrPayloadFormat.Parse(req.RawValue);
        if (!qr.IsValid)
            return Ok(new { type = "UNKNOWN", entityId = (Guid?)null, data = (object?)null, message = "QR content not recognized" });

        object? data = null;
        Guid? entityId = null;

        switch (qr.Type)
        {
            case QrPayloadFormat.Bin:
            {
                var bin = await _context.Bins.Include(b => b.Zone).AsNoTracking()
                    .FirstOrDefaultAsync(b => b.BinCode == qr.Value);
                if (bin != null)
                {
                    entityId = bin.Id;
                    var itemCount = await _context.InventoryItems.CountAsync(i => i.BinId == bin.Id && i.QuantityOnHand > 0);
                    data = new { bin.BinCode, zoneType = bin.Zone?.ZoneType, bin.Status, bin.WarehouseId, itemCount };
                }
                break;
            }
            case QrPayloadFormat.Order:
            {
                var ord = await _context.OutboundOrders.AsNoTracking()
                    .FirstOrDefaultAsync(o => o.OrderNo == qr.Value);
                if (ord != null)
                {
                    entityId = ord.Id;
                    data = new { waybillCode = ord.OrderNo, status = ord.Status.ToString(), ord.WarehouseId, ord.DestinationCity };
                }
                break;
            }
            case QrPayloadFormat.OutboundOrder:
            {
                var ob = await _context.OutboundOrders.AsNoTracking()
                    .FirstOrDefaultAsync(o => o.OrderNo == qr.Value);
                if (ob != null)
                {
                    entityId = ob.Id;
                    var lineCount = await _context.OutboundOrderLines.CountAsync(l => l.OutboundOrderId == ob.Id);
                    var shipmentOrder = await _context.ShipmentOrders.AsNoTracking()
                        .FirstOrDefaultAsync(so => so.OutboundOrderId == ob.Id);
                    data = new { ob.OrderNo, status = ob.Status.ToString(), ob.WarehouseId, ob.DestinationAddress, lineCount, shipmentId = shipmentOrder?.ShipmentId };
                }
                break;
            }
            case QrPayloadFormat.Shipment:
            {
                var shp = await _context.Shipments.AsNoTracking()
                    .FirstOrDefaultAsync(s => s.ShipmentNo == qr.Value);
                if (shp != null)
                {
                    entityId = shp.Id;
                    var orderCount = await _context.ShipmentOrders.CountAsync(so => so.ShipmentId == shp.Id);
                    data = new { shp.ShipmentNo, status = shp.Status.ToString(), shp.Carrier, orderCount, shp.WarehouseId, shp.DestinationId, shp.DestinationType };
                }
                break;
            }
            case QrPayloadFormat.Sku:
            {
                var skuMirror = await _context.ErpSkuMirrors.AsNoTracking()
                    .FirstOrDefaultAsync(s => s.SkuCode == qr.Value);

                var items = await _context.InventoryItems
                    .Where(i => i.Sku == qr.Value && i.QuantityOnHand > 0)
                    .AsNoTracking().ToListAsync();

                if (skuMirror != null || items.Count > 0)
                {
                    data = new
                    {
                        skuCode = qr.Value,
                        skuName = skuMirror?.Name ?? qr.Value,
                        totalOnHand = items.Sum(i => i.QuantityOnHand),
                        totalReserved = items.Sum(i => i.ReservedQty),
                        binBreakdown = items.Select(i => new { i.BinId, i.WarehouseId, i.QuantityOnHand, i.ReservedQty })
                    };
                }
                break;
            }
            case QrPayloadFormat.Receipt:
            {
                var rcv = await _context.InboundReceipts.AsNoTracking()
                    .FirstOrDefaultAsync(r => r.ReceiptNo == qr.Value);
                if (rcv != null)
                {
                    entityId = rcv.Id;
                    var lines = await _context.InboundReceiptLines
                        .Where(l => l.ReceiptId == rcv.Id).AsNoTracking().ToListAsync();
                    data = new { rcv.ReceiptNo, status = rcv.Status.ToString(), lineCount = lines.Count };
                }
                break;
            }
        }

        return Ok(new { type = qr.Type, entityId, data });
    }

    /// <summary>B2: Tra cứu chi tiết ô kệ — tồn kho + đơn hàng đang giữ</summary>
    [HttpGet("lookup/bin/{binId:guid}")]
    public async Task<IActionResult> LookupBin(Guid binId)
    {
        var bin = await _context.Bins.Include(b => b.Zone).AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == binId);
        if (bin == null) return NotFound(Err("QR.EntityNotFound", "Bin không tồn tại."));

        var items = await _context.InventoryItems
            .Where(i => i.BinId == binId && i.QuantityOnHand > 0).AsNoTracking()
            .Select(i => new { i.Sku, i.LotNo, i.QuantityOnHand, i.ReservedQty, AvailableQty = i.QuantityOnHand - i.ReservedQty })
            .ToListAsync();

        string? orderNo = null;
        if (bin.CurrentOrderId.HasValue)
        {
            var ord = await _context.OutboundOrders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == bin.CurrentOrderId.Value);
            orderNo = ord?.OrderNo;
        }

        return Ok(new
        {
            bin.Id, bin.BinCode, bin.Status,
            ZoneType = bin.Zone?.ZoneType,
            bin.Aisle, bin.Rack, bin.Shelf,
            bin.CurrentOrderId, CurrentOrderNo = orderNo,
            Items = items
        });
    }

    /// <summary>B3: Tra cứu đơn hàng — trạng thái, vị trí, lô hàng</summary>
    [HttpGet("lookup/order/{orderId:guid}")]
    public async Task<IActionResult> LookupOrder(Guid orderId)
    {
        var order = await _context.OutboundOrders.Include(o => o.Lines).AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null) return NotFound(Err("QR.EntityNotFound", "OutboundOrder không tồn tại."));

        var bins = await _context.Bins.Where(b => b.CurrentOrderId == orderId).AsNoTracking()
            .Select(b => new { b.Id, b.BinCode, b.Status, b.Aisle, b.Rack, b.Shelf }).ToListAsync();

        object? shipment = null;
        var so = await _context.ShipmentOrders.AsNoTracking().FirstOrDefaultAsync(x => x.OutboundOrderId == orderId);
        if (so != null)
        {
            var shp = await _context.Shipments.AsNoTracking().FirstOrDefaultAsync(x => x.Id == so.ShipmentId);
            if (shp != null) shipment = new { so.ShipmentId, shp.ShipmentNo, Status = shp.Status.ToString() };
        }

        return Ok(new
        {
            order.Id, order.OrderNo, Status = order.Status.ToString(),
            order.WarehouseId, order.DestinationAddress, order.DestinationCity,
            Lines = order.Lines.Select(l => new { l.Sku, l.RequestedQty, l.PickedQty, l.PackedQty }),
            BinLocations = bins,
            Shipment = shipment
        });
    }

    /// <summary>B4: Tra cứu lô hàng — danh sách đơn trong lô</summary>
    [HttpGet("lookup/shipment/{shipmentId:guid}")]
    public async Task<IActionResult> LookupShipment(Guid shipmentId)
    {
        var shp = await _context.Shipments.AsNoTracking().FirstOrDefaultAsync(s => s.Id == shipmentId);
        if (shp == null) return NotFound(Err("QR.EntityNotFound", "Shipment không tồn tại."));

        var orderIds = await _context.ShipmentOrders.Where(x => x.ShipmentId == shipmentId)
            .Select(x => x.OutboundOrderId).ToListAsync();
        var orders = await _context.OutboundOrders.Where(o => orderIds.Contains(o.Id)).AsNoTracking()
            .Select(o => new { o.Id, o.OrderNo, Status = o.Status.ToString() }).ToListAsync();

        return Ok(new
        {
            shp.Id, shp.ShipmentNo, Status = shp.Status.ToString(),
            shp.Carrier, shp.WarehouseId, shp.DestinationId, shp.DestinationType,
            Orders = orders
        });
    }

    /// <summary>B5: Tra cứu tồn kho theo SKU — phân bổ theo bin</summary>
    [HttpGet("lookup/sku/{skuCode}")]
    public async Task<IActionResult> LookupSku(string skuCode)
    {
        var items = await _context.InventoryItems
            .Where(i => i.Sku == skuCode && i.QuantityOnHand > 0)
            .AsNoTracking().ToListAsync();

        // Lấy BinCode qua lookup riêng
        var binIds = items.Select(i => i.BinId).Distinct().ToList();
        var binMap = await _context.Bins.Where(b => binIds.Contains(b.Id)).AsNoTracking()
            .ToDictionaryAsync(b => b.Id, b => b.BinCode);

        return Ok(new
        {
            SkuCode = skuCode,
            TotalOnHand = items.Sum(i => i.QuantityOnHand),
            TotalReserved = items.Sum(i => i.ReservedQty),
            Bins = items.Select(i => new
            {
                i.BinId,
                BinCode = binMap.GetValueOrDefault(i.BinId, "?"),
                i.WarehouseId, i.QuantityOnHand, i.ReservedQty,
                i.LotNo, i.ExpiryDate
            })
        });
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║             NHÓM C — THAO TÁC QUA QR (11 endpoint)            ║
    // ╚══════════════════════════════════════════════════════════════════╝

    /// <summary>C1: Scan SKU + Scan Bin → nhận hàng vào phiếu nhập</summary>
    [HttpPost("actions/scan-receive")]
    public async Task<IActionResult> ScanReceive([FromBody] ScanReceiveRequest req)
    {
        var skuParsed = QrPayloadFormat.Parse(req.ScannedSku);
        var binParsed = QrPayloadFormat.Parse(req.ScannedBin);
        var sku = skuParsed.IsValid ? skuParsed.Value : req.ScannedSku;
        var binCode = binParsed.IsValid ? binParsed.Value : req.ScannedBin;

        var tenantId = CurrentUserClaims.GetTenantId(User) ?? "default";
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";

        // Tìm receipt line theo sku
        var receiptLine = await _context.InboundReceiptLines.AsNoTracking()
            .FirstOrDefaultAsync(l => l.ReceiptId == req.ReceiptId && l.Sku == sku);
        if (receiptLine == null)
            return UnprocessableEntity(Err("QR.SkuMismatch", $"SKU '{sku}' không thuộc phiếu nhập này."));

        var receipt = await _context.InboundReceipts.AsNoTracking().FirstOrDefaultAsync(r => r.Id == req.ReceiptId);
        if (receipt == null) return NotFound(Err("QR.EntityNotFound", "Phiếu nhập không tồn tại."));

        var cmd = new ReceiveInboundItemCommand(
            req.ReceiptId,
            receipt.OrderId,
            tenantId,
            sku,
            binCode,
            operatorSub,
            req.Quantity,
            req.LotNo,
            req.ExpiryDate
        );

        var result = await Mediator.Send(cmd);
        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        var r = result.Value!;

        // Fetch updated status and line progress
        var updatedReceipt = await _context.InboundReceipts.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == req.ReceiptId);
        var updatedLine = await _context.InboundReceiptLines.AsNoTracking()
            .FirstOrDefaultAsync(l => l.ReceiptId == req.ReceiptId && l.Sku == sku);

        var skuExists = await _context.ErpSkuMirrors
            .AnyAsync(x => x.TenantId == receipt.TenantId && x.SkuCode == sku && x.Status == "active");

        var isOverage = updatedLine != null && updatedLine.ReceivedQuantity > updatedLine.ExpectedQuantity;
        var isUnknownSku = !skuExists;

        object? suggestion = null;
        if (r.IsCrossDockSuggested && r.CrossDockTaskId.HasValue)
        {
            var stagingOutBin = await _context.Bins.AsNoTracking()
                .FirstOrDefaultAsync(b => b.WarehouseId == receipt.WarehouseId && b.Zone.ZoneType == ZoneType.Staging.ToString() && b.BinCode.Contains("OUT"));
            suggestion = new
            {
                type = "CROSSDOCK",
                taskId = r.CrossDockTaskId.Value,
                suggestedBinCode = stagingOutBin?.BinCode ?? "STG-OUT-01"
            };
        }
        else if (r.IsPutawaySuggested && r.PutawayTaskId.HasValue)
        {
            suggestion = new
            {
                type = "PUTAWAY",
                taskId = r.PutawayTaskId.Value,
                suggestedBinCode = r.SuggestedPutawayBinCode
            };
        }

        return Ok(new
        {
            success = true,
            receiptStatus = updatedReceipt?.Status.ToString() ?? "PartiallyReceived",
            lineProgress = new { sku, expected = updatedLine?.ExpectedQuantity ?? 0, received = updatedLine?.ReceivedQuantity ?? 0 },
            binCode = binCode,
            alerts = new
            {
                isOverage = isOverage,
                isUnknownSku = isUnknownSku,
                quarantineBin = (isOverage || isUnknownSku) ? "BIN-QUARANTINE" : null
            },
            suggestion = suggestion
        });
    }

    /// <summary>C2: Scan Bin đích → hoàn tất cất hàng (putaway)</summary>
    [HttpPost("actions/confirm-putaway")]
    public async Task<IActionResult> ConfirmPutaway([FromBody] ConfirmPutawayRequest req)
    {
        var binParsed = QrPayloadFormat.Parse(req.ScannedBin);
        var binCode = binParsed.IsValid ? binParsed.Value : req.ScannedBin;
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";

        var result = await Mediator.Send(new CompletePutawayTaskCommand(req.TaskId, binCode, operatorSub));
        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        return Ok(new { success = true, taskId = req.TaskId, actualBinCode = binCode });
    }

    /// <summary>C3: Scan Bin OUT → hoàn tất cross-dock</summary>
    [HttpPost("actions/confirm-crossdock")]
    public async Task<IActionResult> ConfirmCrossDock([FromBody] ConfirmCrossDockRequest req)
    {
        var binParsed = QrPayloadFormat.Parse(req.ScannedBin);
        if (!binParsed.IsValid) return BadRequest(Err("QR.InvalidFormat", "QR Bin không hợp lệ."));

        var task = await _context.CrossDockTasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == req.TaskId);
        if (task == null) return NotFound(Err("QR.EntityNotFound", "CrossDock task không tồn tại."));

        var destBin = await _context.Bins.AsNoTracking().FirstOrDefaultAsync(b => b.Id == task.DestinationBinId);
        if (destBin != null && destBin.BinCode != binParsed.Value)
            return UnprocessableEntity(Err("QR.BinMismatch", $"Bin scan '{binParsed.Value}' không khớp bin đích '{destBin.BinCode}'."));

        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var result = await Mediator.Send(new CompleteCrossDockTaskCommand(req.TaskId, operatorSub, binParsed.Value));
        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        return Ok(new { success = true, taskId = req.TaskId });
    }

    /// <summary>C4: Scan kiện → nhận hàng trung chuyển (transit receive)</summary>
    [HttpPost("actions/transit-receive")]
    public async Task<IActionResult> TransitReceive([FromBody] TransitReceiveRequest req)
    {
        var orderParsed = QrPayloadFormat.Parse(req.ScannedOrder);
        if (!orderParsed.IsValid) return BadRequest(Err("QR.InvalidFormat", "QR đơn hàng không hợp lệ."));

        // Tìm shipment chứa đơn hàng này
        var order = await _context.OutboundOrders.AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNo == orderParsed.Value);
        if (order == null) return NotFound(Err("QR.EntityNotFound", $"Đơn hàng '{orderParsed.Value}' không tìm thấy."));

        var shipmentOrder = await _context.ShipmentOrders.AsNoTracking()
            .FirstOrDefaultAsync(so => so.OutboundOrderId == order.Id);
        if (shipmentOrder == null) return BadRequest(Err("QR.InvalidState", "Đơn hàng chưa được gán vào lô hàng nào."));

        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var result = await Mediator.Send(new ReceiveTransitShipmentCommand(
            order.Id, req.WarehouseId, operatorSub, req.ReceivedItems, req.ScannedBin));

        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        // Fetch discrepancies created during the transit receive
        var discrepancies = await _context.TransitDiscrepancies.AsNoTracking()
            .Where(td => td.OutboundOrderId == order.Id && td.ShipmentId == shipmentOrder.ShipmentId && td.WarehouseId == req.WarehouseId)
            .ToListAsync();

        var isFinalDestination = (req.WarehouseId.ToString() == order.PartnerId);
        var nextAction = isFinalDestination ? "DELIVER" : "SORT";

        var discrepancyObj = discrepancies.Count > 0
            ? new
              {
                  hasDiscrepancy = true,
                  items = discrepancies.Select(d => new
                  {
                      sku = d.Sku,
                      shipped = d.ShippedQty,
                      received = d.ReceivedQty,
                      shortage = d.DiscrepancyQty
                  }),
                  discrepancyId = discrepancies.First().Id
              }
            : null;

        return Ok(new
        {
            success = true,
            orderId = order.Id,
            waybillCode = orderParsed.Value,
            receiptCreated = true,
            isFinalDestination = isFinalDestination,
            nextAction = nextAction,
            discrepancy = discrepancyObj
        });
    }

    /// <summary>C5: Scan Bin nguồn + SKU → hoàn tất lấy hàng (pick)</summary>
    [HttpPost("actions/confirm-pick")]
    public async Task<IActionResult> ConfirmPick([FromBody] ConfirmPickRequest req)
    {
        var binParsed = QrPayloadFormat.Parse(req.ScannedBin);
        var skuParsed = QrPayloadFormat.Parse(req.ScannedSku);

        var task = await _context.PickTasks
            .Include(t => t.OutboundOrderLine)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == req.PickTaskId);
        if (task == null) return NotFound(Err("QR.EntityNotFound", "PickTask không tồn tại."));

        // Validate bin khớp
        if (binParsed.IsValid)
        {
            var fromBin = await _context.Bins.AsNoTracking().FirstOrDefaultAsync(b => b.Id == task.FromBinId);
            if (fromBin != null && fromBin.BinCode != binParsed.Value)
                return UnprocessableEntity(Err("QR.BinMismatch", $"Bin scan '{binParsed.Value}' không khớp bin nguồn '{fromBin.BinCode}'."));
        }

        // Validate SKU khớp
        var skuValue = skuParsed.IsValid ? skuParsed.Value : req.ScannedSku;
        if (task.OutboundOrderLine.Sku != skuValue)
            return UnprocessableEntity(Err("QR.SkuMismatch", $"SKU scan '{skuValue}' không khớp SKU cần lấy '{task.OutboundOrderLine.Sku}'."));

        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var result = await Mediator.Send(new ConfirmPickCommand(req.PickTaskId, operatorSub));
        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        return Ok(new { success = true, pickTaskId = req.PickTaskId, sku = task.OutboundOrderLine.Sku, quantity = task.Quantity });
    }

    /// <summary>C6: Scan SKU → xác nhận đúng sản phẩm khi đóng gói (verify-pack)</summary>
    [HttpPost("actions/verify-pack")]
    public async Task<IActionResult> VerifyPack([FromBody] VerifyPackRequest req)
    {
        var skuParsed = QrPayloadFormat.Parse(req.ScannedSku);
        var skuCode = skuParsed.IsValid ? skuParsed.Value : req.ScannedSku;

        var order = await _context.OutboundOrders.Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == req.OutboundOrderId);
        if (order == null) return NotFound(Err("QR.EntityNotFound", "Đơn xuất không tồn tại."));

        if (order.Status != OutboundOrderStatus.Picked
            && order.Status != OutboundOrderStatus.PartiallyPicked
            && order.Status != OutboundOrderStatus.Packing)
            return Conflict(Err("QR.InvalidState", $"Đơn đang '{order.Status}', không thể verify pack."));

        var line = order.Lines.FirstOrDefault(l => l.Sku == skuCode);
        if (line == null) return UnprocessableEntity(Err("QR.SkuMismatch", $"SKU '{skuCode}' không thuộc đơn này."));

        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? "sys";

        // Track bằng PackVerification
        var pv = await _context.PackVerifications
            .FirstOrDefaultAsync(p => p.OutboundOrderId == req.OutboundOrderId && p.Sku == skuCode);

        if (pv == null)
        {
            pv = new PackVerification(req.OutboundOrderId, skuCode, req.Quantity, operatorId);
            _context.PackVerifications.Add(pv);
        }
        else
        {
            pv.AddQuantity(req.Quantity);
        }

        if (pv.ScannedQty > line.RequestedQty)
            return UnprocessableEntity(Err("QR.QuantityExceeded",
                $"Đã scan {pv.ScannedQty} > yêu cầu {line.RequestedQty} cho SKU '{skuCode}'."));

        await _context.SaveChangesAsync(default);

        // Build response
        var allPv = await _context.PackVerifications
            .Where(p => p.OutboundOrderId == req.OutboundOrderId).AsNoTracking().ToListAsync();

        var verifiedItems = order.Lines.Select(l =>
        {
            var v = allPv.FirstOrDefault(x => x.Sku == l.Sku);
            var scanned = v?.ScannedQty ?? 0;
            return new { l.Sku, Required = l.RequestedQty, Scanned = scanned, Complete = scanned >= l.RequestedQty };
        }).ToList();

        return Ok(new
        {
            success = true,
            order.OrderNo,
            VerifiedItems = verifiedItems,
            AllItemsVerified = verifiedItems.All(v => v.Complete),
            RemainingSkus = verifiedItems.Where(v => !v.Complete).Select(v => v.Sku)
        });
    }

    /// <summary>C7: Scan kiện courier → Sort + gom vào Shipment</summary>
    [HttpPost("actions/scan-sort")]
    public async Task<IActionResult> ScanSort([FromBody] ScanSortRequest req)
    {
        var orderParsed = QrPayloadFormat.Parse(req.ScannedOrder);
        if (!orderParsed.IsValid) return BadRequest(Err("QR.InvalidFormat", "QR đơn hàng không hợp lệ."));

        var order = await _context.OutboundOrders.AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderNo == orderParsed.Value);
        if (order == null) return NotFound(Err("QR.EntityNotFound", $"Đơn '{orderParsed.Value}' không tìm thấy."));
        if (order.OrderId == Guid.Empty) return BadRequest(Err("QR.InvalidState", "Đơn này không có OMS OrderId để sort."));

        var tenantId = CurrentUserClaims.GetTenantId(User) ?? "default";
        var operatorId = CurrentUserClaims.GetCustomerId(User) ?? "sys";

        var result = await Mediator.Send(new SortOrderCommand(
            order.OrderId, req.DestinationWarehouseId, tenantId, operatorId, null));

        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        // Fetch consolidated shipment and route details after command completes successfully
        var shipmentOrder = await _context.ShipmentOrders
            .Include(so => so.Shipment)
            .FirstOrDefaultAsync(so => so.OutboundOrderId == order.Id);

        string destName = "";
        Guid? destId = null;
        if (shipmentOrder?.Shipment != null)
        {
            if (Guid.TryParse(shipmentOrder.Shipment.DestinationId, out var parsedDestId))
            {
                destId = parsedDestId;
                var wh = await _context.Warehouses.AsNoTracking().FirstOrDefaultAsync(w => w.Id == parsedDestId);
                destName = wh?.Name ?? "";
            }
        }

        var finalDestWhId = await _context.InboundReceipts.AsNoTracking()
            .Where(r => r.OrderId == order.OrderId)
            .Select(r => r.FinalDestinationWarehouseId)
            .FirstOrDefaultAsync();

        string finalDestName = "";
        if (finalDestWhId.HasValue)
        {
            var wh = await _context.Warehouses.AsNoTracking().FirstOrDefaultAsync(w => w.Id == finalDestWhId.Value);
            finalDestName = wh?.Name ?? "";
        }

        var orderCount = shipmentOrder != null
            ? await _context.ShipmentOrders.CountAsync(so => so.ShipmentId == shipmentOrder.ShipmentId)
            : 0;

        return Ok(new
        {
            success = true,
            orderId = order.OrderId,
            waybillCode = orderParsed.Value,
            outboundOrderId = order.Id,
            outboundOrderNo = order.OrderNo,
            shipment = shipmentOrder != null ? new
            {
                shipmentId = shipmentOrder.ShipmentId,
                shipmentNo = shipmentOrder.Shipment.ShipmentNo,
                status = shipmentOrder.Shipment.Status.ToString(),
                currentOrderCount = orderCount,
                destination = new { warehouseId = destId, warehouseName = destName }
            } : null,
            routing = new
            {
                finalDestination = finalDestName,
                nextHop = destName,
                totalHops = 1,
                currentHop = 1
            }
        });
    }

    /// <summary>C8: Scan thùng → xác nhận đã chất lên xe (load vào Shipment)</summary>
    [HttpPost("actions/scan-load")]
    public async Task<IActionResult> ScanLoad([FromBody] ScanLoadRequest req)
    {
        var orderParsed = QrPayloadFormat.Parse(req.ScannedOrder);
        if (!orderParsed.IsValid) return BadRequest(Err("QR.InvalidFormat", "QR đơn hàng không hợp lệ."));

        var order = await _context.OutboundOrders
            .FirstOrDefaultAsync(o => o.OrderNo == orderParsed.Value);
        if (order == null) return NotFound(Err("QR.EntityNotFound", $"Đơn '{orderParsed.Value}' không tìm thấy."));

        if (order.Status != OutboundOrderStatus.Packed && order.Status != OutboundOrderStatus.Loaded)
            return Conflict(Err("QR.InvalidState", $"Đơn '{order.OrderNo}' đang '{order.Status}', cần Packed/Loaded."));

        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var result = await Mediator.Send(new ShipOrderCommand(order.Id, operatorSub, req.ShipmentId));
        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        // Đếm progress
        int totalOrders = 0;
        if (req.ShipmentId.HasValue)
            totalOrders = await _context.ShipmentOrders.CountAsync(so => so.ShipmentId == req.ShipmentId.Value);

        return Ok(new
        {
            success = true,
            outboundOrderId = order.Id,
            order.OrderNo,
            shipmentId = req.ShipmentId,
            loadProgress = new { totalOrders, loadedOrders = totalOrders },
            newStatus = "Loaded"
        });
    }

    /// <summary>C9: Scan thùng → Ship + giải phóng ô kệ (1 bước)</summary>
    [HttpPost("actions/ship-and-release")]
    public async Task<IActionResult> ShipAndRelease([FromBody] ShipAndReleaseRequest req)
    {
        var orderParsed = QrPayloadFormat.Parse(req.ScannedOrder);
        if (!orderParsed.IsValid) return BadRequest(Err("QR.InvalidFormat", "QR đơn hàng không hợp lệ."));

        var order = await _context.OutboundOrders.FirstOrDefaultAsync(o => o.OrderNo == orderParsed.Value);
        if (order == null) return NotFound(Err("QR.EntityNotFound", $"Đơn '{orderParsed.Value}' không tìm thấy."));

        if (order.Status != OutboundOrderStatus.Packed && order.Status != OutboundOrderStatus.Loaded)
            return Conflict(Err("QR.InvalidState", $"Đơn đang '{order.Status}', cần Packed/Loaded."));

        // Ship qua handler
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        var result = await Mediator.Send(new ShipOrderCommand(order.Id, operatorSub, req.ShipmentId));
        if (!result.IsSuccess) return BadRequest(Err(result.Error.Code, result.Error.Message));

        // Release bins
        var bins = await _context.Bins.Where(b => b.CurrentOrderId == order.Id).ToListAsync();
        var releasedCodes = new List<string>();
        foreach (var bin in bins) { bin.Release(); releasedCodes.Add(bin.BinCode); }
        if (releasedCodes.Count > 0) await _context.SaveChangesAsync(default);

        return Ok(new
        {
            success = true,
            orderId = order.Id,
            order.OrderNo,
            newStatus = "Shipped",
            releasedBinCodes = releasedCodes,
            message = $"Xuất kho thành công. Giải phóng {releasedCodes.Count} ô kệ."
        });
    }

    /// <summary>C10: Scan Bin → xác nhận đúng kệ cần kiểm kê (blind count)</summary>
    [HttpPost("actions/cycle-count-start")]
    public async Task<IActionResult> CycleCountStart([FromBody] CycleCountStartRequest req)
    {
        var binParsed = QrPayloadFormat.Parse(req.ScannedBin);
        if (!binParsed.IsValid) return BadRequest(Err("QR.InvalidFormat", "QR Bin không hợp lệ."));

        var task = await _context.CountTasks.FirstOrDefaultAsync(t => t.Id == req.CountTaskId);
        if (task == null) return NotFound(Err("QR.EntityNotFound", "CountTask không tồn tại."));

        var taskBin = await _context.Bins.AsNoTracking().FirstOrDefaultAsync(b => b.Id == task.BinId);
        if (taskBin != null && taskBin.BinCode != binParsed.Value)
            return UnprocessableEntity(Err("QR.BinMismatch",
                $"Bin scan '{binParsed.Value}' không khớp bin cần kiểm '{taskBin.BinCode}'."));

        return Ok(new
        {
            success = true,
            taskId = task.Id,
            binCode = taskBin?.BinCode,
            task.Sku,
            task.ExpectedQty,
            Status = task.Status.ToString()
        });
    }

    /// <summary>C11: Scan Bin nguồn + Bin đích → hoàn tất bổ sung hàng (replenish)</summary>
    [HttpPost("actions/confirm-replenish")]
    public async Task<IActionResult> ConfirmReplenish([FromBody] ConfirmReplenishRequest req)
    {
        var srcParsed = QrPayloadFormat.Parse(req.ScannedSourceBin);
        var dstParsed = QrPayloadFormat.Parse(req.ScannedDestBin);
        if (!srcParsed.IsValid || !dstParsed.IsValid)
            return BadRequest(Err("QR.InvalidFormat", "QR Bin nguồn/đích không hợp lệ."));

        var task = await _context.ReplenishmentTasks.FirstOrDefaultAsync(t => t.Id == req.TaskId);
        if (task == null) return NotFound(Err("QR.EntityNotFound", "ReplenishmentTask không tồn tại."));

        var srcBin = await _context.Bins.AsNoTracking().FirstOrDefaultAsync(b => b.Id == task.SourceBinId);
        var dstBin = await _context.Bins.AsNoTracking().FirstOrDefaultAsync(b => b.Id == task.DestinationBinId);

        if (srcBin != null && srcBin.BinCode != srcParsed.Value)
            return UnprocessableEntity(Err("QR.BinMismatch",
                $"Bin nguồn scan '{srcParsed.Value}' không khớp '{srcBin.BinCode}'."));
        if (dstBin != null && dstBin.BinCode != dstParsed.Value)
            return UnprocessableEntity(Err("QR.BinMismatch",
                $"Bin đích scan '{dstParsed.Value}' không khớp '{dstBin.BinCode}'."));

        // Complete + move inventory
        var tenantId = CurrentUserClaims.GetTenantId(User) ?? "default";
        var operatorSub = CurrentUserClaims.GetCustomerId(User) ?? "sys";
        task.Complete();

        await _inventoryService.MoveAsync(
            tenantId, task.WarehouseId, task.SourceBinId, task.DestinationBinId,
            task.Sku, task.RequestedQty, task.Id.ToString(), operatorSub, default);

        await _context.SaveChangesAsync(default);

        return Ok(new
        {
            success = true,
            taskId = task.Id,
            task.Sku,
            task.RequestedQty,
            SourceBin = srcBin?.BinCode,
            DestBin = dstBin?.BinCode
        });
    }

    // ╔══════════════════════════════════════════════════════════════════╗
    // ║                         HELPERS                                 ║
    // ╚══════════════════════════════════════════════════════════════════╝

    private FileContentResult QrPng(string payload, string filename)
        => File(_qrCodeService.GeneratePng(payload), "image/png", filename);

    private string ToBase64(string payload)
        => Convert.ToBase64String(_qrCodeService.GeneratePng(payload, 5));

    private static object Err(string code, string message)
        => new { Error = code, Message = message };
}

// ╔══════════════════════════════════════════════════════════════════╗
// ║                      REQUEST DTOs                               ║
// ╚══════════════════════════════════════════════════════════════════╝

public record ParseRequest(string RawValue, Guid? WarehouseId = null);
public record ScanReceiveRequest(Guid ReceiptId, string ScannedSku, string ScannedBin, int Quantity, string? LotNo = null, DateTime? ExpiryDate = null);
public record ConfirmPutawayRequest(Guid TaskId, string ScannedBin);
public record ConfirmCrossDockRequest(Guid TaskId, string ScannedBin);
public record TransitReceiveRequest(string ScannedOrder, Guid WarehouseId, string? ScannedBin = null, Dictionary<string, int>? ReceivedItems = null);
public record ConfirmPickRequest(Guid PickTaskId, string ScannedBin, string ScannedSku);
public record VerifyPackRequest(Guid OutboundOrderId, string ScannedSku, int Quantity);
public record ScanSortRequest(string ScannedOrder, Guid? DestinationWarehouseId = null);
public record ScanLoadRequest(string ScannedOrder, Guid? ShipmentId = null);
public record ShipAndReleaseRequest(string ScannedOrder, Guid? ShipmentId = null);
public record CycleCountStartRequest(Guid CountTaskId, string ScannedBin);
public record ConfirmReplenishRequest(Guid TaskId, string ScannedSourceBin, string ScannedDestBin);
