# 10 — API Contract: Internal Warehouse Flows

## Base URL

```
https://{gateway}/api
```
(YARP gateway route → Warehouse Service)

---

## Replenishment APIs

### GET /inventory/tasks/replenish

Lấy danh sách Replenishment Tasks.

**Query params:**
| Param | Type | Required | Mô tả |
|-------|------|----------|-------|
| `warehouseId` | Guid | No | Lọc theo kho |
| `assignedToMe` | bool | No | Chỉ lấy task của mình |
| `unassigned` | bool | No | Chỉ lấy task chưa assign |

**Response 200:**
```json
[
  {
    "id": "uuid",
    "sku": "SKU-001",
    "quantity": 20,
    "fromBinId": "HN1-STG-A01-R03-S02",
    "toBinId": "HN1-PCK-B01-R01-S01",
    "status": "pending",
    "assignedTo": "user-sub",
    "priority": "High",
    "productName": "Laptop Dell XPS",
    "uom": "PCS"
  }
]
```

---

### POST /inventory/tasks/replenishments/{id}/assign

Assign task cho operator hiện tại.

**Path params:** `id: Guid`  
**Auth:** Bearer JWT (Keycloak)  
**Response:** `200 OK` (no body)

---

### POST /inventory/tasks/replenish/{id}/start

Bắt đầu thực hiện task (chuyển sang InProgress).

**Path params:** `id: Guid`  
**Response:** `200 OK` (no body)

---

### POST /qrcode/actions/confirm-replenish

Hoàn tất bổ sung hàng. Ghi nhận quét cả 2 kệ.

**Request:**
```json
{
  "taskId": "uuid",
  "scannedSourceBin": "BIN:HN1-STG-A01-R03-S02",
  "scannedDestBin": "BIN:HN1-PCK-B01-R01-S01",
  "quantity": 20
}
```
> `quantity` là optional. Nếu null → dùng `RequestedQty` của task.  
> BIN: prefix được strip tự động phía backend.

**Response 200:**
```json
{
  "success": true,
  "taskId": "uuid",
  "transferredQty": 20,
  "sourceActual": "HN1-STG-A01-R03-S02",
  "destActual": "HN1-PCK-B01-R01-S01"
}
```

**Errors:**
| Code | HTTP | Mô tả |
|------|------|-------|
| `QR.EntityNotFound` | 404 | Task không tồn tại |
| `QR.BinMismatch` | 422 | Bin quét không khớp task |
| `QR.InvalidState` | 409 | Task không ở trạng thái đúng |
| `QR.InsufficientStock` | 422 | Source bin không đủ hàng |

---

## Cycle Count APIs

### GET /inventory/tasks/cycle-count

Lấy danh sách Count Tasks.

**Query params:** (tương tự replenish)

**Response 200:**
```json
[
  {
    "id": "uuid",
    "binId": "HN1-PCK-B01-R01-S01",
    "sku": "SKU-001",
    "expectedQty": 25,
    "countedQty": null,
    "status": "pending",
    "assignedTo": null,
    "priority": "Normal"
  }
]
```
> `sku: null` = đếm tất cả SKU trong bin.

---

### POST /inventory/tasks/cycle-count/{id}/assign

Assign count task.

**Response:** `200 OK`

---

### POST /inventory/tasks/cycle-count/{id}/start

Bắt đầu count task (ghi StartedAt).

**Response:** `200 OK`

---

### POST /qrcode/actions/cycle-count-start

Xác minh bin vật lý trước khi đếm (Blind Count verification).

**Request:**
```json
{
  "countTaskId": "uuid",
  "scannedBin": "BIN:HN1-PCK-B01-R01-S01"
}
```

**Response 200:**
```json
{
  "verified": true,
  "binCode": "HN1-PCK-B01-R01-S01",
  "taskId": "uuid"
}
```

**Errors:**
| Code | HTTP | Mô tả |
|------|------|-------|
| `QR.EntityNotFound` | 404 | Task không tồn tại |
| `QR.BinMismatch` | 422 | Bin quét sai |

---

### POST /inventory/reconcile

Điều chỉnh tồn kho sau khi đếm.

**Request:**
```json
{
  "WarehouseId": "uuid",
  "Sku": "SKU-001",
  "BinCode": "HN1-PCK-B01-R01-S01",
  "CountedQuantity": 23,
  "Reason": "PDA Cycle Count"
}
```

**Response 200:**
```json
{
  "success": true,
  "adjustmentQty": -2,
  "systemBefore": 25,
  "countedQty": 23
}
```

---

### POST /inventory/tasks/cycle-count/{id}/approve

Supervisor phê duyệt kết quả kiểm kê (Web only).

**Response:** `200 OK`

---

## QR Code — Nhóm A: Sinh mã

| Method | Route | Mô tả |
|--------|-------|-------|
| GET | `/qrcode/bin/{binId}` | Sinh QR PNG cho ô kệ |
| GET | `/qrcode/warehouse/{id}/bins/batch` | Sinh QR hàng loạt cho kho |
| GET | `/qrcode/sku/{skuCode}` | Sinh QR cho SKU |
| GET | `/qrcode/order/{orderId}` | Sinh QR cho đơn OMS |
| GET | `/qrcode/outbound-order/{id}` | Sinh QR cho đơn xuất kho |
| GET | `/qrcode/shipment/{id}` | Sinh QR cho lô hàng |
| GET | `/qrcode/receipt/{id}` | Sinh QR cho phiếu nhập |

---

## QR Code — Nhóm B: Giải mã & Tra cứu

| Method | Route | Mô tả |
|--------|-------|-------|
| POST | `/qrcode/parse` | Parse chuỗi QR thô → type + data |
| GET | `/qrcode/lookup/bin/{binId}` | Tra cứu tồn kho tại bin |
| GET | `/qrcode/lookup/order/{orderId}` | Tra cứu đơn hàng |
| GET | `/qrcode/lookup/shipment/{id}` | Tra cứu lô hàng |
| GET | `/qrcode/lookup/sku/{skuCode}` | Tra cứu tồn kho theo SKU |

---

## QR Code — Nhóm C: Thao tác (11 endpoints)

| # | Route | Mobile Screen | Mô tả |
|---|-------|---------------|-------|
| C1 | `POST /qrcode/actions/scan-receive` | ReceiveScanScreen | Nhận hàng vào phiếu nhập |
| C2 | `POST /qrcode/actions/confirm-putaway` | PutawayExecutionScreen | Hoàn tất cất hàng |
| C3 | `POST /qrcode/actions/confirm-crossdock` | CrossDockScreen | Hoàn tất cross-dock |
| C4 | `POST /qrcode/actions/transit-receive` | TransitReceiveScreen | Nhận hàng trung chuyển |
| C5 | `POST /qrcode/actions/confirm-pick` | PickExecutionScreen | Hoàn tất lấy hàng |
| C6 | `POST /qrcode/actions/verify-pack` | PackOrderScreen | Xác minh đóng gói |
| C7 | `POST /qrcode/actions/scan-sort` | SortScreen | Sort + gom vào Shipment |
| C8 | `POST /qrcode/actions/scan-load` | DispatchLoadScreen | Chất lên xe |
| C9 | `POST /qrcode/actions/ship-and-release` | ShipReleaseScreen | Xuất kho + giải phóng bin |
| C10 | `POST /qrcode/actions/cycle-count-start` | CycleCountExecutionScreen | Xác minh bin kiểm kê |
| C11 | `POST /qrcode/actions/confirm-replenish` | ReplenishmentExecutionScreen | Hoàn tất bổ sung hàng |

---

## QR Payload Format

```
BIN:{binCode}           → "BIN:HN1-PCK-B01-R01-S01"
SKU:{skuCode}           → "SKU:LAPTOP-DELL-XPS-001"
ORD:{orderNo}           → "ORD:ORD-2026-000123"
OBO:{outboundOrderNo}   → "OBO:OBO-2026-000456"
SHP:{shipmentNo}        → "SHP:SHP-2026-000789"
RCV:{receiptNo}         → "RCV:RCV-2026-001012"
```

> Backend `QrPayloadFormat.Parse()` tự động nhận dạng prefix và strip nó.  
> Mobile `QrActionService` strip prefix `BIN:` trước khi gửi lên một số endpoint.

---

## Error Response Format (chuẩn)

```json
{
  "error": "QR.BinMismatch",
  "message": "Bin scan 'HN1-STG-B02-R01-S01' không khớp bin đích 'HN1-PCK-B01-R01-S01'."
}
```

> `ErrorHandler.showError(context, e)` ở Mobile tự parse `AppException` và hiển thị SnackBar với đúng message.
