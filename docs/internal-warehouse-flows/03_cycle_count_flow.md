# 03 — Luồng Kiểm kê định kỳ (Cycle Count Flow)

## 1. Tổng quan nghiệp vụ

Cycle Count là quy trình kiểm đếm định kỳ để đảm bảo tồn kho hệ thống khớp với thực tế. Hệ thống hỗ trợ 2 chế độ:

| Chế độ | Screen | Đặc điểm |
|--------|--------|-----------|
| **Ad-hoc** | `CycleCountScreen` | Nhập tự do Bin + SKU + Qty, không cần task |
| **Task-driven** | `CycleCountExecutionScreen` | Gắn với CountTask, bắt buộc quét bin xác minh |

---

## 2. Trạng thái Task (State Machine)

```
                    ┌──────────────────────────────────────┐
                    │              CountTask                │
                    └──────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │           Pending             │  ← Được tạo bởi hệ thống
              └───────────────┬───────────────┘   (GenerateCountTasks)
                              │
              ┌───────────────▼───────────────┐
              │  Pending (assigned)           │  ← POST /cycle-count/{id}/assign
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  Pending (started)            │  ← POST /cycle-count/{id}/start
              │  (StartedAt được ghi)         │     (StartedAt = UtcNow)
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │  BIN VERIFIED                 │  ← POST /qrcode/actions/cycle-count-start
              │  (mobile state: _isBinVerified│     Xác minh bin + lock field
              │   = true)                     │
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │           Counted             │  ← POST /inventory/reconcile
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │           Adjusted            │  ← POST /cycle-count/{id}/approve (Supervisor)
              └───────────────────────────────┘

              + Cancelled  ← bất kỳ lúc nào
```

---

## 3. Quy trình thực tế PDA — Chi tiết bước

```
Dashboard                  PDA Screen                 Backend
    │                          │                          │
    │  Tap "Count Task"        │                          │
    │──────────────────────────▶│                          │
    │                          │ showModalBottomSheet     │
    │                          │  Chi tiết:               │
    │                          │  - Kệ: BIN-XXX           │
    │                          │  - SKU: ABC hoặc "Tất cả"│
    │                          │  - Đã đếm: X/Y           │
    │                          │                          │
    │  Tap "Nhận việc"         │                          │
    │──────────────────────────▶│                          │
    │                          │ POST /cycle-count/       │
    │                          │ {id}/assign              │
    │                          │─────────────────────────▶│
    │                          │ 200 OK                   │
    │                          │◀─────────────────────────│
    │                          │                          │
    │                          │ POST /cycle-count/       │
    │                          │ {id}/start               │
    │                          │─────────────────────────▶│
    │                          │ 200 OK                   │
    │                          │◀─────────────────────────│
    │                          │                          │
    │  Navigate to             │                          │
    │  /wms/cycle_count_       │                          │
    │  execution/{taskId}      │                          │
    │  ?binCode=XXX&sku=YYY    │                          │
    │──────────────────────────▶│                          │
    │                          │                          │
    │              ┌───────────┴──────────────────────────│
    │              │  BƯỚC 1: XÁC MINH KỆ (Blind Count)   │
    │              │  - Màn hình hiển thị to: "BIN-XXX"   │
    │              │  - Icon full screen: fact_check       │
    │              │  - "Quét mã vạch kệ để tiếp tục"     │
    │              │  - Quét bin qua hardware/camera       │
    │              └───────────┬──────────────────────────│
    │                          │ _verifyBin()             │
    │                          │                          │
    │                          │ 1. Validate local:       │
    │                          │    bin == targetBinCode? │
    │                          │                          │
    │                          │ 2. POST /qrcode/actions/ │
    │                          │    cycle-count-start     │
    │                          │    {countTaskId, bin}    │
    │                          │─────────────────────────▶│
    │                          │ 200 OK                   │
    │                          │◀─────────────────────────│
    │                          │                          │
    │                          │ _isBinVerified = true    │
    │                          │ AnimatedSwitcher slide→  │
    │              ┌───────────┴──────────────────────────│
    │              │  BƯỚC 2: ĐẾM HÀNG                    │
    │              │  - Header: "Kệ: BIN-XXX" (locked)    │
    │              │  - Nếu sku=="Tất cả": quét SKU       │
    │              │  - Nếu sku cố định: hiển thị SKU     │
    │              │  - Custom numpad: 0-9 + C + ✓        │
    │              │  - Số đếm to (72px font)             │
    │              └───────────┬──────────────────────────│
    │                          │ Tap ✓ (submit)           │
    │                          │                          │
    │                          │ POST /inventory/reconcile│
    │                          │ {WarehouseId, Sku,       │
    │                          │  BinCode, CountedQty,    │
    │                          │  Reason: "PDA Cycle..."}  │
    │                          │─────────────────────────▶│
    │                          │ 200 OK                   │
    │                          │◀─────────────────────────│
    │                          │                          │
    │                          │ context.pop()            │
    │◀─────────────────────────│  → Dashboard refresh     │
```

---

## 4. Chế độ Ad-hoc vs Task-driven

### Ad-hoc (CycleCountScreen — `/wms/count`)
```
Nhân viên nhập tự do:
  BinCode field (free text / scan)
  SKU field (free text / scan)
  Qty field (text input)
  → POST /inventory/reconcile trực tiếp
  → Không gắn với CountTask nào
  → Không verify bin với backend
```

### Task-driven (CycleCountExecutionScreen — `/wms/cycle_count_execution/:taskId`)
```
Nhân viên nhận task cụ thể:
  BinCode được LOCK từ task (không thể sửa)
  Phải QUÉT BIN vật lý khớp → backend verify
  Sau verify: nhập số đếm qua numpad
  → POST /inventory/reconcile (gắn với task)
  → CountTask.status → Counted
```

---

## 5. Backend Logic — cycle-count-start

```csharp
// POST /api/qrcode/actions/cycle-count-start
// Request: { countTaskId, scannedBin }

1. Load CountTask by countTaskId
2. Load Bin by scannedBin (BinCode)
3. Validate: bin.Id == task.BinId  
   → Nếu không khớp: 422 QR.BinMismatch
4. task.Start() → StartedAt = UtcNow (nếu chưa có)
5. SaveChanges
6. Return 200 {verified: true, binCode, taskId}
```

---

## 6. Backend Logic — /inventory/reconcile

```csharp
// POST /api/inventory/reconcile
// Request: { WarehouseId, Sku, BinCode, CountedQuantity, Reason }

1. Find InventoryItem by (WarehouseId, Sku, BinCode)
2. Calculate delta = CountedQuantity - currentQty
3. Adjust InventoryItem.QuantityOnHand = CountedQuantity
4. Ghi InventoryLedger entry (type: CycleCountAdjustment)
5. Create InventoryReconciliationReport
6. Publish integration event: InventoryAdjustedEvent
7. SaveChanges
```

---

## 7. SKU Mode: "Tất cả" vs Cụ thể

| Mode | Điều kiện | Hành vi trên PDA |
|------|-----------|------------------|
| SKU cụ thể | `task.sku != null` | Field SKU bị lock, hiển thị text to |
| Tất cả SKU | `task.sku == null` | Field SKU là input tự do, nhân viên quét từng SKU trong kệ |

---

## 8. Mapping dữ liệu (API ↔ Mobile)

| API Response Field | Mobile Usage |
|--------------------|--------------|
| `id` | taskId (param cho route) |
| `binId` | targetBinCode (param `binCode`) |
| `sku` | targetSku (param `sku`), "Tất cả" nếu null |
| `expectedQty` | Hiển thị trong modal: "Đếm: X/Y" |
| `countedQty` | Hiển thị trong modal |
| `status` | Filter + badge |
| `assignedTo` | Kiểm tra ownership |

---

## 9. Vấn đề vận hành & Quyết định thiết kế

### Câu hỏi: Có bắt buộc quét bin không?

**Quyết định**: Có. Đây là **Blind Count** — nhân viên không được biết số lượng kỳ vọng trước khi đếm, phải xác minh vị trí bằng cách quét bin vật lý.

**Lý do**:
1. Tránh nhân viên gian lận (điền số kỳ vọng mà không đếm thật)
2. Xác minh nhân viên đang ở đúng vị trí kệ
3. Backend track `StartedAt` để audit trail

**Trade-off**: Nếu máy quét hỏng, nhân viên có thể dùng camera qua nút "Quét bằng Camera".
