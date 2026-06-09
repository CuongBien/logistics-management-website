# Kế hoạch xây dựng hệ thống QR Code — LMS (v3)

---

## 1. Bối cảnh: 3 cách tạo OutboundOrder

Hệ thống có **3 nguồn** tạo OutboundOrder, mỗi nguồn luồng QR khác nhau:

| Nguồn | Trigger | Luồng |
|-------|---------|-------|
| **OMS Courier Sort** | `OrderType=Parcel, Fulfillment=Pickup` → Shipper lấy hàng → Nhận vào kho → **Sort** → Hệ thống tự tạo OutboundOrder (status=Packed) + Shipment (status=Loading) | Kiện hàng courier đi qua hub. Sort tự gom vào Shipment theo tuyến. Không cần pick/pack riêng. |
| **OMS Warehouse** | `OrderType=Parcel, Fulfillment=Warehouse` → `OrderCreatedConsumer` tự tạo OutboundOrder + Allocate | Xuất từ tồn kho. Cần đầy đủ: Allocate → Pick → Pack → Ship |
| **WMS Manual** | Admin tạo trực tiếp qua `POST /api/outbound/orders` | B2B wholesale, nội bộ. Cần đầy đủ: Allocate → Pick → Pack → Ship |
| | | |
| **InboundRequest** | `OrderType=InboundRequest` → `OrderCreatedConsumer` tạo InboundReceipt | Chỉ nhập kho lưu trữ. Không có outbound. Receive → Putaway → xong. |

---

## 2. Luồng chi tiết: Sort → Load → Dispatch → Transit

Đây là luồng **vận chuyển liên kho** mà bản trước thiếu.

```
NV scan QR kiện (ORD:xxx) → Gọi Sort API
  → Sort handler tự:
    1. Tìm destination warehouse (từ request / FinalDestinationWarehouseId / WarehouseRoute)
    2. Tạo OutboundOrder (Draft → Allocated → Picking → Picked → Packed trong 1 transaction)
    3. Tìm/tạo Shipment theo tuyến (cùng destination, chưa đầy xe)
    4. Gom order vào Shipment → Shipment.MarkLoading()
    5. OutboundOrder → Loaded

NV tiếp tục scan kiện tiếp → Gom thêm vào cùng Shipment (nếu còn tải)

Khi đủ tải hoặc hết giờ:
  → NV gọi Dispatch → Shipment.MarkShipped() → Xe rời kho

Tại kho đích:
  → NV scan QR kiện → Transit-Receive
    → So sánh shipped vs received → Tạo TransitDiscrepancy nếu thiếu
    → Nếu đây là kho cuối → Sort cho last-mile delivery
    → Nếu đây là hub trung gian → Sort tiếp cho hop tiếp theo
```

**Các bước cần QR trong luồng này:**

| Bước | QR quét | Mục đích |
|------|---------|----------|
| Sort: Scan kiện | **ORD:{waybillCode}** | Xác định orderId → hệ thống tự xử lý routing |
| Load: Scan kiện lên xe | **ORD:{waybillCode}** hoặc **OB:{orderNo}** | Xác nhận kiện đã lên xe (Shipment) |
| Dispatch: Scan lô hàng | **SHP:{shipmentNo}** | Xác nhận lô đã rời kho |
| Transit-Receive: Scan kiện | **ORD:{waybillCode}** | Đối chiếu manifest, phát hiện thiếu hàng |

---

## 3. Luồng chi tiết: Pack → Verify → Ship (WMS Outbound)

Bản trước thiếu bước **pack verification** và **load scan**.

```
Pick hoàn tất → Hàng tập kết tại trạm đóng gói (hoặc Wall Slot)

Bước Pack:
  1. NV mở đơn xuất trên PDA
  2. Scan QR từng sản phẩm → Hệ thống check: đúng SKU? đúng số lượng?
  3. Khi đủ → Đóng hộp → In tem QR OutboundOrder → Dán lên thùng
  4. API: POST /api/outbound/orders/{id}/pack

Bước Load (lên xe):
  1. Xe tải đậu bãi xuất
  2. NV scan QR trên từng thùng carton → Hệ thống gom vào Shipment
  3. Scan xong tất cả → API: POST /api/outbound/orders/{id}/ship
  4. Khi xe đầy → API: POST /api/outbound/shipments/{id}/dispatch
```

**Các bước cần QR:**

| Bước | QR quét | Mục đích |
|------|---------|----------|
| Pack: Verify items | **SKU:{skuCode}** | Xác nhận đúng sản phẩm, đúng số lượng |
| Pack: In tem | — (sinh QR **OB:{orderNo}**) | Dán lên thùng |
| Load: Scan lên xe | **OB:{orderNo}** | Gom vào Shipment, xác nhận đã chất |
| Dispatch: Scan lô | **SHP:{shipmentNo}** | Xác nhận xe rời bãi |

---

## 4. Chuẩn format QR

| Loại | Format | Ví dụ |
|------|--------|-------|
| Ô kệ | `BIN:{binCode}` | `BIN:A-03-02` |
| Đơn vận chuyển (Courier) | `ORD:{waybillCode}` | `ORD:LMS2506031234` |
| Đơn xuất kho (WMS) | `OB:{orderNo}` | `OB:SORTED-A1B2C3D4` |
| Lô hàng | `SHP:{shipmentNo}` | `SHP:SHP-A1B2C3D4-20250603-XYZ` |
| Sản phẩm | `SKU:{skuCode}` | `SKU:LAPTOP-DELL-5520` |
| Phiếu nhập | `RCV:{receiptNo}` | `RCV:RCV-20250603-001` |

Barcode nhà cung cấp (không có prefix) → parse fallback lookup by skuCode.

---

## 5. TOÀN BỘ ENDPOINT QR

### NHÓM A — SINH MÃ (7 endpoint)

| # | Method | Endpoint | Ai dùng | Khi nào |
|---|--------|----------|---------|---------|
| A1 | GET | `/api/qrcode/bin/{binId}` | Admin kho | Sau tạo Bin, in tem dán kệ |
| A2 | GET | `/api/qrcode/warehouse/{id}/bins/batch` | Admin kho | Setup kho mới, in hàng loạt |
| A3 | GET | `/api/qrcode/order/{orderId}` | Consignor / NV kho | Tạo đơn Parcel → in tem vận đơn |
| A4 | GET | `/api/qrcode/outbound-order/{id}` | NV đóng gói | Bước Pack → in tem thùng carton |
| A5 | GET | `/api/qrcode/shipment/{shipmentId}` | NV xuất kho | Sau Ship → dán tem lô lên pallet/xe |
| A6 | GET | `/api/qrcode/receipt/{receiptId}` | NV nhận hàng | Sau tạo phiếu nhập → in kèm lô hàng đến |
| A7 | GET | `/api/qrcode/sku/{skuCode}` | NV kho | Sản phẩm không có barcode sẵn → in tem |

---

### NHÓM B — GIẢI MÃ & TRA CỨU (5 endpoint)

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| B1 | POST | `/api/qrcode/parse` | **Trung tâm.** Nhận chuỗi thô → trả `{ type, entityId, data }` |
| B2 | GET | `/api/qrcode/lookup/bin/{binId}` | Chi tiết kệ + danh sách tồn kho bên trong |
| B3 | GET | `/api/qrcode/lookup/order/{orderId}` | Chi tiết đơn + tracking + vị trí hiện tại |
| B4 | GET | `/api/qrcode/lookup/shipment/{shipmentId}` | Chi tiết lô + danh sách đơn trong lô |
| B5 | GET | `/api/qrcode/lookup/sku/{skuCode}` | Tồn kho tổng + phân bổ theo bin |

---

### NHÓM C — THAO TÁC QUA QR (11 endpoint)

#### Inbound

| # | Method | Endpoint | Mô tả | Body |
|---|--------|----------|-------|------|
| C1 | POST | `/api/qrcode/actions/scan-receive` | Scan SKU + Scan Bin → nhận hàng vào phiếu | `{ receiptId, scannedSku, scannedBin, quantity, lotNo?, expiryDate? }` |
| C2 | POST | `/api/qrcode/actions/confirm-putaway` | Scan Bin đích → hoàn tất cất hàng | `{ taskId, scannedBin }` |
| C3 | POST | `/api/qrcode/actions/confirm-crossdock` | Scan Bin OUT → hoàn tất cross-dock | `{ taskId, scannedBin }` |
| C4 | POST | `/api/qrcode/actions/transit-receive` | Scan kiện → nhận hàng trung chuyển | `{ scannedOrder, warehouseId, scannedBin?, receivedItems? }` |

#### Outbound

| # | Method | Endpoint | Mô tả | Body |
|---|--------|----------|-------|------|
| C5 | POST | `/api/qrcode/actions/confirm-pick` | Scan Bin nguồn + Scan SKU → hoàn tất lấy hàng | `{ pickTaskId, scannedBin, scannedSku }` |
| C6 | POST | `/api/qrcode/actions/verify-pack` | **MỚI.** Scan SKU → xác nhận đúng sản phẩm khi đóng gói | `{ outboundOrderId, scannedSku, quantity }` |
| C7 | POST | `/api/qrcode/actions/scan-sort` | **MỚI.** Scan kiện courier → Sort + gom vào Shipment | `{ scannedOrder, destinationWarehouseId? }` |
| C8 | POST | `/api/qrcode/actions/scan-load` | **MỚI.** Scan thùng → xác nhận đã chất lên xe (gán vào Shipment) | `{ scannedOrder, shipmentId }` |
| C9 | POST | `/api/qrcode/actions/ship-and-release` | Scan thùng → Ship + consume tồn kho 1 bước | `{ scannedOrder, shipmentId? }` |

#### Nội bộ

| # | Method | Endpoint | Mô tả | Body |
|---|--------|----------|-------|------|
| C10 | POST | `/api/qrcode/actions/cycle-count-start` | Scan Bin → xác nhận đúng kệ cần kiểm (blind count) | `{ countTaskId, scannedBin }` |
| C11 | POST | `/api/qrcode/actions/confirm-replenish` | Scan Bin nguồn + Bin đích → hoàn tất bổ sung | `{ taskId, scannedSourceBin, scannedDestBin }` |

---

## 6. Tổng hợp: 23 endpoint

| Nhóm | Số lượng | Endpoint |
|------|----------|----------|
| **A — Sinh mã** | 7 | bin, bins/batch, order, outbound-order, shipment, receipt, sku |
| **B — Giải mã** | 5 | parse, lookup/bin, lookup/order, lookup/shipment, lookup/sku |
| **C — Thao tác** | 11 | scan-receive, confirm-putaway, confirm-crossdock, transit-receive, confirm-pick, verify-pack, scan-sort, scan-load, ship-and-release, cycle-count-start, confirm-replenish |
| **Tổng** | **23** | |

---

## 7. Mapping: Endpoint ↔ Từng luồng

### Luồng Courier (Parcel + Pickup)

```
Consignor tạo đơn → In tem vận đơn (#A3)
  → Shipper scan lấy hàng (#B1 parse → pickup API)
  → NV kho scan nhận (#C1 scan-receive)
  → NV kho scan Sort (#C7 scan-sort) ← TỰ tạo OutboundOrder + gom Shipment
  → NV scan Load lên xe (#C8 scan-load)
  → Dispatch (#B4 lookup/shipment xem trước → dispatch API)
  → Hub đích: scan Transit-Receive (#C4 transit-receive)
  → Hub cuối: scan Sort last-mile (#C7 lại) hoặc Sort hop tiếp
  → Tài xế giao: scan kiện (#B1 parse → deliver API)
```

### Luồng Warehouse Fulfillment (Parcel + Warehouse)

```
OMS tạo đơn → Consumer tự tạo OutboundOrder + Allocate
  → NV Pick: scan kệ + sản phẩm (#C5 confirm-pick)
  → NV Pack: scan sản phẩm verify (#C6 verify-pack) → In tem (#A4)
  → NV Load: scan thùng lên xe (#C8 scan-load) hoặc (#C9 ship-and-release)
  → Dispatch (#B4 → dispatch API)
  → Hub đích: transit-receive (#C4) hoặc giao thẳng
```

### Luồng WMS Manual (B2B)

```
Admin tạo OutboundOrder → Allocate
  → Pick (#C5) → Pack verify (#C6) → In tem (#A4)
  → Load (#C8) → Dispatch
```

### Luồng InboundRequest (Nhập kho lưu trữ)

```
Consignor tạo đơn type=InboundRequest → Consumer tạo InboundReceipt
  → In phiếu nhập (#A6)
  → NV nhận hàng: scan SKU + Bin (#C1 scan-receive)
  → NV cất hàng: scan Bin đích (#C2 confirm-putaway)
  → Xong. Không có outbound.
```

### Luồng nội bộ

```
Setup kho: tạo Bin → In tem (#A1, #A2)
In tem sản phẩm: (#A7)
Kiểm kê: scan Bin (#C10) → đếm → submit → approve
Bổ sung: scan Bin nguồn + đích (#C11) → complete
Điều chuyển: scan (#B1 parse) → transfer API có sẵn
Đối soát: scan (#B2 lookup/bin) → reconcile API có sẵn
```

---

## 8. Endpoint mới vs API CRUD có sẵn

> [!IMPORTANT]
> **Nguyên tắc:** Nhóm C **không duplicate logic**. Bên trong mỗi action endpoint:
> 1. Parse chuỗi QR → xác định entity
> 2. Validate (đúng kệ? đúng SKU? đúng trạng thái?)
> 3. **Delegate sang Command Handler hiện có** (ReceiveInboundItem, CompletePutawayTask, ConfirmPick, SortOrder, v.v.)
> 4. Trả response đã enriched cho PDA

**Ví dụ `C7 scan-sort` bên trong:**
```csharp
// 1. Parse
var parseResult = _qrService.Parse(request.ScannedOrder); // → type=ORDER, waybillCode
// 2. Tìm OrderId từ waybillCode
var order = await _context.Orders.FirstAsync(o => o.WaybillCode == parseResult.WaybillCode);
// 3. Delegate sang SortOrderCommand hiện có
var result = await _mediator.Send(new SortOrderCommand(order.Id, request.DestinationWarehouseId, ...));
// 4. Return enriched
return new ScanSortResponse { OrderId, ShipmentNo, DestinationWarehouse, ... };
```

> [!TIP]
> **Nếu Frontend đủ thông minh** (tự parse + tự gọi API CRUD), thì Nhóm C là optional. Nhưng cho PDA/Mobile dùng 1 chạm thì Nhóm C là bắt buộc.

---

## 9. Response format chi tiết

### B1 — `POST /api/qrcode/parse` (API trung tâm)

**Request:**
```json
{ "rawValue": "ORD:LMS2506031234", "warehouseId": "optional-guid" }
```

**Response (thành công):**
```json
{
  "type": "ORDER",
  "entityId": "a1b2c3d4-...",
  "data": {
    "waybillCode": "LMS2506031234",
    "status": "InWarehouse",
    "orderType": "Parcel",
    "fulfillmentMode": "Pickup",
    "consigneeName": "Nguyễn Văn A",
    "consigneeCity": "HCM",
    "currentWarehouseId": "guid",
    "currentWarehouseName": "Kho Cần Thơ"
  }
}
```

**Các loại type và data tương ứng:**

| Type | Khi nào | Data fields |
|------|---------|-------------|
| `BIN` | Chuỗi bắt đầu `BIN:` | `binCode, zoneType, zoneName, status, warehouseId, warehouseName, itemCount` |
| `ORDER` | Chuỗi bắt đầu `ORD:` | `waybillCode, status, orderType, fulfillmentMode, consigneeName, consigneeCity, currentWarehouseId` |
| `OUTBOUND_ORDER` | Chuỗi bắt đầu `OB:` | `orderNo, status, warehouseId, destination, lineCount, shipmentId?` |
| `SHIPMENT` | Chuỗi bắt đầu `SHP:` | `shipmentNo, status, carrier, orderCount, warehouseId, destinationId, destinationType` |
| `SKU` | Chuỗi bắt đầu `SKU:` hoặc fallback match | `skuCode, skuName, uom, totalOnHand, totalReserved, warehouseBreakdown?` |
| `RECEIPT` | Chuỗi bắt đầu `RCV:` | `receiptNo, orderId, status, lineCount, receivedPercentage` |
| `UNKNOWN` | Không match | `null` |

**Response (không nhận ra):**
```json
{ "type": "UNKNOWN", "entityId": null, "data": null, "message": "QR content not recognized" }
```

---

### C1 — `POST /api/qrcode/actions/scan-receive`

**Request:**
```json
{
  "receiptId": "guid",
  "scannedSku": "SKU:LAPTOP-DELL-5520",
  "scannedBin": "BIN:STG-IN-01",
  "quantity": 5,
  "lotNo": "LOT-2025-06",
  "expiryDate": "2026-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "receiptStatus": "PartiallyReceived",
  "lineProgress": { "sku": "LAPTOP-DELL-5520", "expected": 50, "received": 25 },
  "binCode": "STG-IN-01",
  "alerts": {
    "isOverage": false,
    "isUnknownSku": false,
    "quarantineBin": null
  },
  "suggestion": {
    "type": "PUTAWAY",
    "taskId": "guid",
    "suggestedBinCode": "A-03-02"
  }
}
```

> Nếu `suggestion.type` = `"CROSSDOCK"` → hàng cần xuất thẳng, không cất kệ.

---

### C6 — `POST /api/qrcode/actions/verify-pack`

**Request:**
```json
{
  "outboundOrderId": "guid",
  "scannedSku": "SKU:LAPTOP-DELL-5520",
  "quantity": 1
}
```

**Response:**
```json
{
  "success": true,
  "orderNo": "OB-20250603-001",
  "verifiedItems": [
    { "sku": "LAPTOP-DELL-5520", "required": 2, "scanned": 2, "complete": true },
    { "sku": "MOUSE-LOGI-B100", "required": 5, "scanned": 3, "complete": false }
  ],
  "allItemsVerified": false,
  "remainingSkus": ["MOUSE-LOGI-B100"]
}
```

> Khi `allItemsVerified = true` → FE tự gọi `POST /api/outbound/orders/{id}/pack` để chuyển trạng thái.

---

### C7 — `POST /api/qrcode/actions/scan-sort`

**Request:**
```json
{
  "scannedOrder": "ORD:LMS2506031234",
  "destinationWarehouseId": "optional-guid"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "guid",
  "waybillCode": "LMS2506031234",
  "outboundOrderId": "guid",
  "outboundOrderNo": "SORTED-A1B2C3D4",
  "shipment": {
    "shipmentId": "guid",
    "shipmentNo": "SHP-...",
    "status": "Loading",
    "currentOrderCount": 15,
    "destination": { "warehouseId": "guid", "warehouseName": "Kho HCM" }
  },
  "routing": {
    "finalDestination": "Kho Hà Nội",
    "nextHop": "Kho Đà Nẵng",
    "totalHops": 3,
    "currentHop": 1
  }
}
```

---

### C8 — `POST /api/qrcode/actions/scan-load`

**Request:**
```json
{
  "scannedOrder": "OB:SORTED-A1B2C3D4",
  "shipmentId": "guid"
}
```

**Response:**
```json
{
  "success": true,
  "outboundOrderId": "guid",
  "orderNo": "SORTED-A1B2C3D4",
  "shipmentId": "guid",
  "shipmentNo": "SHP-...",
  "loadProgress": {
    "totalOrders": 20,
    "loadedOrders": 15,
    "remainingOrders": 5
  },
  "newStatus": "Loaded"
}
```

---

### C4 — `POST /api/qrcode/actions/transit-receive`

**Request:**
```json
{
  "scannedOrder": "ORD:LMS2506031234",
  "warehouseId": "guid",
  "scannedBin": "BIN:STG-IN-01",
  "receivedItems": [
    { "sku": "LAPTOP-DELL-5520", "quantity": 5 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "guid",
  "waybillCode": "LMS2506031234",
  "receiptCreated": true,
  "isFinalDestination": false,
  "nextAction": "SORT",
  "discrepancy": {
    "hasDiscrepancy": true,
    "items": [
      { "sku": "LAPTOP-DELL-5520", "shipped": 10, "received": 5, "shortage": 5 }
    ],
    "discrepancyId": "guid"
  }
}
```

> `nextAction` = `"SORT"` (hub trung gian, cần sort tiếp) hoặc `"DELIVER"` (kho cuối, giao hàng) hoặc `"STORE"` (InboundRequest, cất kho).

---

## 10. Error handling chuẩn

Tất cả endpoint QR trả error theo format `Result<T>` hiện có:

```json
{
  "isSuccess": false,
  "error": {
    "code": "QR.InvalidFormat",
    "message": "QR content does not match any known format: 'abc123'"
  }
}
```

**Bảng mã lỗi QR:**

| Code | Khi nào | HTTP Status |
|------|---------|-------------|
| `QR.InvalidFormat` | Chuỗi QR không đúng format `PREFIX:value` và không match fallback | 400 |
| `QR.EntityNotFound` | Parse thành công nhưng entity không tồn tại trong DB | 404 |
| `QR.BinMismatch` | Scan confirm-putaway/pick nhưng BinCode không khớp với task | 422 |
| `QR.SkuMismatch` | Scan confirm-pick/verify-pack nhưng SKU không khớp | 422 |
| `QR.InvalidState` | Entity đang ở trạng thái không cho phép thao tác (ví dụ pack đơn chưa pick) | 409 |
| `QR.DuplicateScan` | Kiện đã được scan load/ship rồi (idempotent check) | 409 |
| `QR.QuantityExceeded` | verify-pack scan quá số lượng cần | 422 |
| `Operator.Forbidden` | NV không có quyền tại zone/warehouse này | 403 |

---

## 11. Thay đổi DB / Entity cần thiết

> [!NOTE]
> Hệ thống QR **không cần thêm bảng DB mới**. Toàn bộ 23 endpoint hoạt động trên các entity hiện có. Chỉ cần thêm 1 bảng tracking nhỏ cho verify-pack.

### 11.1. Bảng mới: `PackVerification` (cho C6 verify-pack)

```csharp
public class PackVerification
{
    public Guid Id { get; set; }
    public Guid OutboundOrderId { get; set; }
    public string Sku { get; set; }
    public int ScannedQty { get; set; }
    public DateTime LastScannedAt { get; set; }
    public string OperatorId { get; set; }
}
```

**Lý do:** verify-pack cần track "đã scan bao nhiêu SKU rồi" cho 1 đơn xuất. Không có entity nào hiện tại track việc này. Bảng này transient — xóa sau khi đơn Pack xong.

### 11.2. Không cần thay đổi entity hiện có

- `Bin`, `InboundReceipt`, `OutboundOrder`, `Shipment`, `PickTask`, `PutawayTask` — Tất cả đã có đủ field cần thiết.
- `BinCode`, `SkuCode`, `WaybillCode`, `OrderNo`, `ShipmentNo` — Tất cả đã là string, sẵn sàng encode vào QR.

---

## 12. Phân phase triển khai

### Phase 1: Nền tảng (Bắt buộc — Làm trước)

| # | Endpoint | Lý do ưu tiên |
|---|----------|---------------|
| B1 | `parse` | Mọi thao tác scan đều đi qua API này |
| A1 | `bin/{id}` | Setup kho cần in tem kệ trước |
| A2 | `bins/batch` | In hàng loạt khi setup |
| A3 | `order/{id}` | In tem vận đơn — luồng courier cơ bản |
| B2 | `lookup/bin` | Tra cứu kệ — dùng mọi lúc |

**Kèm theo:** `QrCodeFormatService` (encode/decode prefix), `QrCodeController` scaffold.

### Phase 2: Inbound (Nhận hàng + Cất kệ)

| # | Endpoint | Lý do |
|---|----------|-------|
| A6 | `receipt/{id}` | In phiếu nhập |
| A7 | `sku/{skuCode}` | In tem sản phẩm |
| C1 | `scan-receive` | Nhận hàng bằng scan |
| C2 | `confirm-putaway` | Cất hàng bằng scan |
| C3 | `confirm-crossdock` | Cross-dock bằng scan |
| B5 | `lookup/sku` | Tra cứu tồn kho SKU |

### Phase 3: Outbound (Xuất kho)

| # | Endpoint | Lý do |
|---|----------|-------|
| A4 | `outbound-order/{id}` | In tem thùng carton |
| A5 | `shipment/{id}` | In tem lô hàng |
| C5 | `confirm-pick` | Lấy hàng bằng scan |
| C6 | `verify-pack` | Xác nhận đóng gói |
| C8 | `scan-load` | Chất hàng lên xe |
| C9 | `ship-and-release` | Ship 1 chạm |
| B3 | `lookup/order` | Tra cứu đơn |
| B4 | `lookup/shipment` | Tra cứu lô |

### Phase 4: Vận chuyển liên kho + Nội bộ

| # | Endpoint | Lý do |
|---|----------|-------|
| C7 | `scan-sort` | Sort courier bằng scan |
| C4 | `transit-receive` | Nhận trung chuyển |
| C10 | `cycle-count-start` | Kiểm kê bằng scan |
| C11 | `confirm-replenish` | Bổ sung hàng bằng scan |

---

## 13. Frontend / Mobile integration points

### Web Dashboard (Admin/Quản lý)

| Màn hình | Endpoint QR dùng | Hành động |
|----------|-------------------|-----------|
| Quản lý kho → Chi tiết Bin | A1 `bin/{id}` | Nút "In tem QR" |
| Quản lý kho → Danh sách Bins | A2 `bins/batch` | Nút "In tem hàng loạt" |
| Chi tiết đơn hàng (OMS) | A3 `order/{id}` | Dialog "In tem vận đơn" |
| Chi tiết đơn xuất (WMS) | A4 `outbound-order/{id}` | Nút "In tem thùng" (sau Pack) |
| Chi tiết Shipment | A5 `shipment/{id}` | Nút "In tem lô" |
| Chi tiết phiếu nhập | A6 `receipt/{id}` | Nút "In phiếu" |
| Danh mục sản phẩm | A7 `sku/{skuCode}` | Nút "In tem sản phẩm" |

### PDA / Mobile App (Nhân viên kho)

| Màn hình | Endpoint QR dùng | Flow |
|----------|-------------------|------|
| Nhận hàng | C1 `scan-receive` | Scan SKU → Scan Bin → Xác nhận qty → Submit |
| Cất hàng | C2 `confirm-putaway` | Xem task → Di chuyển → Scan Bin đích → Xác nhận |
| Cross-dock | C3 `confirm-crossdock` | Xem task → Di chuyển → Scan Bin OUT → Xác nhận |
| Lấy hàng (Pick) | C5 `confirm-pick` | Xem task → Đi tới kệ → Scan Bin → Scan SKU → Xác nhận |
| Đóng gói (Pack) | C6 `verify-pack` | Mở đơn → Scan từng SKU → Khi đủ → Pack |
| Sort courier | C7 `scan-sort` | Scan kiện → Xem tuyến → Đặt đúng khu |
| Chất lên xe | C8 `scan-load` | Chọn Shipment → Scan từng thùng → Load |
| Nhận trung chuyển | C4 `transit-receive` | Scan kiện → Đối chiếu → Xác nhận |
| Kiểm kê | C10 `cycle-count-start` | Xem task → Scan Bin → Đếm → Submit |
| Bổ sung hàng | C11 `confirm-replenish` | Xem task → Scan Bin nguồn → Scan Bin đích → Xác nhận |
| Tra cứu nhanh | B1 `parse` | Scan bất kỳ → Xem thông tin |

### Shipper / Tài xế App

| Màn hình | Endpoint QR dùng | Flow |
|----------|-------------------|------|
| Lấy hàng (Pickup) | B1 `parse` → Ordering pickup API | Scan kiện → Xác nhận lấy |
| Giao hàng (Deliver) | B1 `parse` → Ordering deliver API | Scan kiện → Upload POD → Xác nhận giao |

---

## 14. Tổng kết

```mermaid
graph TB
    subgraph "Nhóm A: Sinh mã (7)"
        A1[A1: bin] 
        A2[A2: bins/batch]
        A3[A3: order]
        A4[A4: outbound-order]
        A5[A5: shipment]
        A6[A6: receipt]
        A7[A7: sku]
    end
    
    subgraph "Nhóm B: Giải mã (5)"
        B1[B1: parse ⭐]
        B2[B2: lookup/bin]
        B3[B3: lookup/order]
        B4[B4: lookup/shipment]
        B5[B5: lookup/sku]
    end
    
    subgraph "Nhóm C: Thao tác (11)"
        C1[C1: scan-receive]
        C2[C2: confirm-putaway]
        C3[C3: confirm-crossdock]
        C4[C4: transit-receive]
        C5[C5: confirm-pick]
        C6[C6: verify-pack]
        C7[C7: scan-sort]
        C8[C8: scan-load]
        C9[C9: ship-and-release]
        C10[C10: cycle-count-start]
        C11[C11: confirm-replenish]
    end
    
    B1 --> C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9 & C10 & C11

