# 02 — Luồng Bổ sung hàng (Replenishment Flow)

## 1. Tổng quan nghiệp vụ

Replenishment là quá trình di chuyển hàng từ **kệ Lưu trữ (Bulk/Storage)** sang **kệ Nhặt hàng (Pick Face/Picking)** để đảm bảo kệ nhặt luôn đủ hàng phục vụ Picking.

```
[Kệ Storage/Bulk]  ──── Nhân viên lấy hàng ────▶  [Kệ Picking/Pick Face]
  SourceBin                                            DestinationBin
  (fromBinId)                                          (toBinId)
```

---

## 2. Trạng thái Task (State Machine)

```
                    ┌──────────────────────────────────────┐
                    │         ReplenishmentTask             │
                    └──────────────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │           Pending             │  ← Được tạo bởi hệ thống
              └───────────────┬───────────────┘   (GenerateReplenishmentTasks)
                              │
              ┌───────────────▼───────────────┐
              │  Pending (assigned)           │  ← POST /replenishments/{id}/assign
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │          InProgress           │  ← POST /replenish/{id}/start
              └───────────────┬───────────────┘
                              │
              ┌───────────────▼───────────────┐
              │          Completed            │  ← POST /qrcode/actions/confirm-replenish
              └───────────────────────────────┘

              + Cancelled  ← bất kỳ lúc nào
```

---

## 3. Quy trình thực tế PDA — Chi tiết bước

```
Dashboard                  PDA Screen                 Backend
    │                          │                          │
    │  Tap "Replenishment Task" │                          │
    │──────────────────────────▶│                          │
    │                          │ showModalBottomSheet     │
    │                          │  (Chi tiết task)         │
    │                          │                          │
    │  Tap "Nhận việc"         │                          │
    │──────────────────────────▶│                          │
    │                          │ POST /replenishments/    │
    │                          │ {id}/assign              │
    │                          │─────────────────────────▶│
    │                          │ 200 OK                   │
    │                          │◀─────────────────────────│
    │                          │                          │
    │                          │ POST /replenish/         │
    │                          │ {id}/start               │
    │                          │─────────────────────────▶│
    │                          │ 200 OK                   │
    │                          │◀─────────────────────────│
    │                          │                          │
    │  Navigate to             │                          │
    │  ReplenishmentExecution  │                          │
    │──────────────────────────▶│                          │
    │                          │                          │
    │                   ┌──────┴──────────────────────────│
    │                   │  BƯỚC 1: Lấy hàng (Source Bin)  │
    │                   │  - Hiển thị: SKU, Qty, SourceBin│
    │                   │  - Quét / nhập mã kệ nguồn      │
    │                   │  - Validate vs widget.sourceBin  │
    │                   │  - Có thể "BÁO THIẾU HÀNG"      │
    │                   └──────┬──────────────────────────│
    │                          │ _nextStep()              │
    │                   ┌──────┴──────────────────────────│
    │                   │  BƯỚC 2: Cất hàng (Dest Bin)    │
    │                   │  - Quét / nhập mã kệ đích       │
    │                   │  - Validate vs widget.destBin   │
    │                   └──────┬──────────────────────────│
    │                          │ Tap "HOÀN TẤT BỔ SUNG"  │
    │                          │                          │
    │                          │ POST /qrcode/actions/    │
    │                          │ confirm-replenish        │
    │                          │ {taskId, scannedSrc,     │
    │                          │  scannedDst, qty?}       │
    │                          │─────────────────────────▶│
    │                          │ 200 {success: true}      │
    │                          │◀─────────────────────────│
    │                          │                          │
    │                          │ context.pop()            │
    │◀─────────────────────────│  → Dashboard refresh     │
    │  invalidate(unifiedTasks)│                          │
```

---

## 4. Xử lý Short Replenish (Báo thiếu hàng)

Khi nhân viên lấy được ít hơn số lượng yêu cầu:

```
Bước 1 đang mở
      │
      ▼
Tap "BÁO THIẾU HÀNG"
      │
      ▼
AlertDialog:
  - Hiển thị: "Số lượng yêu cầu: X PCS"
  - Input: "Số lượng thực tế lấy được" (phải < X)
      │
      ▼
_handleShortReplenish(actualQty)
      │
      ▼
POST /qrcode/actions/confirm-replenish
  {taskId, scannedSourceBin, destBin: widget.destBin, quantity: actualQty}
      │
      ▼
Backend xử lý partial replenishment
Task → Completed (với actualQty < requestedQty)
```

> **Lưu ý vận hành**: Khi báo thiếu ở Bước 1 (chưa đến kệ đích), hệ thống tự dùng `widget.destBin` (bin đích theo kế hoạch) để tránh yêu cầu nhân viên phải đi thêm đến kệ đích chỉ để quét.

---

## 5. Backend Logic — confirm-replenish

```csharp
// POST /api/qrcode/actions/confirm-replenish
// Request: { taskId, scannedSourceBin, scannedDestBin, quantity? }

1. Parse QR code (BIN: prefix stripping)
2. Load ReplenishmentTask by taskId
3. Validate:
   - SourceBin match (scannedSourceBin vs task.SourceBin.BinCode)
   - DestBin match (scannedDestBin vs task.DestinationBin.BinCode)
4. Gọi IInventoryService để chuyển tồn kho:
   - InventoryItem tại SourceBin: qty -= requestedQty (hoặc actualQty)
   - InventoryItem tại DestBin: qty += requestedQty
5. task.Complete(actualDestBinId)
6. Ghi InventoryLedger (2 entries: REPLENISH_OUT + REPLENISH_IN)
7. SaveChanges
```

---

## 6. Vấn đề vận hành & Quyết định thiết kế

### Câu hỏi: Nhân viên thoát app khi đang đi từ nguồn → đích

**Rủi ro**: Đã quét source bin nhưng chưa quét dest bin → thoát app → state `_sourceBinController.text` bị mất.

**Phân tích**:
- State chỉ lưu in-memory (`TextEditingController`)
- Không có persistence (SharedPreferences / local DB)
- Khi re-open: task vẫn ở trạng thái `InProgress`, nhân viên phải quét lại source bin

**Đề xuất cải thiện** (nếu cần):
```dart
// Lưu vào SharedPreferences khi quét source bin xong
final prefs = await SharedPreferences.getInstance();
await prefs.setString('pending_replenish_${widget.taskId}_source', src);

// Khi initState, load lại nếu có
final saved = prefs.getString('pending_replenish_${widget.taskId}_source');
if (saved != null) _sourceBinController.text = saved;
```

**Kết luận hiện tại**: Chấp nhận được cho MVP. Nhân viên chỉ cần quét lại kệ nguồn (đang ở gần đó hoặc đã ghi nhớ vị trí). Task vẫn `InProgress` → không bị mất.

---

## 7. Mapping dữ liệu (API ↔ Mobile)

| API Response Field | Mobile Model Field | Hiển thị |
|--------------------|--------------------|----------|
| `id` | `task.id` | taskId |
| `sku` | `task['sku']` | Title: "SKU: xxx" |
| `quantity` | `task['quantity']` | "X PCS" |
| `fromBinId` | `task['fromBinId']` | Subtitle + sourceBin param |
| `toBinId` | `task['toBinId']` | Subtitle + destBin param |
| `status` | `task['status']` | Badge màu |
| `assignedTo` | `internalTask.assignedTo` | Kiểm tra ownership |
| `priority` | `task['priority']` | secondaryData |
