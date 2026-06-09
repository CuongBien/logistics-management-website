# 09 — Gap Analysis: Backend vs Mobile PDA

## Tổng quan trạng thái implement

> Phân tích dựa trên code thực tế, không phải thiết kế trên giấy.

---

## ✅ Đã implement đầy đủ

### Replenishment Flow

| Component | File | Trạng thái |
|-----------|------|-----------|
| `ReplenishmentExecutionScreen` | `lib/features/wms/inventory/presentation/replenishment_execution_screen.dart` | ✅ Đầy đủ |
| 2-step stepper UI | Trong file trên | ✅ |
| Short replenish dialog | Trong file trên | ✅ |
| Hardware scanner support | `ScannerHelper` + `KeyboardListener` | ✅ |
| Camera scanner | `CameraScannerDialog` | ✅ |
| QR Service `confirmReplenish` | `lib/features/wms/qr/services/qr_action_service.dart` | ✅ |
| `assignReplenishmentTask` | `lib/features/wms/inventory/data/inventory_repository.dart` | ✅ |
| `startReplenishmentTask` | Trong file trên | ✅ |
| Dashboard modal + navigation | `lib/features/home/presentation/dashboard_screen.dart` | ✅ |
| Route `/wms/replenishment_execution` | `lib/core/utils/router.dart` | ✅ |
| Backend `POST /qrcode/actions/confirm-replenish` | `QrCodeController.cs` | ✅ |
| Backend assign/start endpoints | `InventoryTasksController.cs` | ✅ |

### Cycle Count Flow

| Component | File | Trạng thái |
|-----------|------|-----------|
| `CycleCountExecutionScreen` | `lib/features/wms/inventory/presentation/cycle_count_execution_screen.dart` | ✅ Đầy đủ |
| 2-step: verify bin + numpad count | Trong file trên | ✅ |
| Animated transition step 1→2 | `AnimatedSwitcher` + `SlideTransition` | ✅ |
| Custom numpad widget | `_CustomNumpad` | ✅ |
| "Tất cả" SKU mode | SKU free-input khi task.sku == null | ✅ |
| QR Service `cycleCountStart` | `lib/features/wms/qr/services/qr_action_service.dart` | ✅ |
| `assignCycleCountTask` | `lib/features/wms/inventory/data/inventory_repository.dart` | ✅ |
| `startCycleCountTask` | Trong file trên | ✅ |
| `reconcileCycleCount` | Trong file trên | ✅ |
| Dashboard modal + navigation | `lib/features/home/presentation/dashboard_screen.dart` | ✅ |
| Route `/wms/cycle_count_execution/:taskId` | `lib/core/utils/router.dart` | ✅ |
| Backend `POST /qrcode/actions/cycle-count-start` | `QrCodeController.cs` | ✅ |
| Backend assign/start/reconcile | `InventoryTasksController.cs` + `InventoryController.cs` | ✅ |

### Ad-hoc Cycle Count

| Component | File | Trạng thái |
|-----------|------|-----------|
| `CycleCountScreen` (ad-hoc) | `lib/features/wms/inventory/presentation/cycle_count_screen.dart` | ✅ Đầy đủ |
| Route `/wms/count` | `router.dart` | ✅ |

---

## ⚠️ Điểm cần cải thiện (không blocking)

### 1. State Persistence cho Replenishment (Medium priority)

**Vấn đề**: Nếu nhân viên đã quét source bin (step 1) rồi thoát app, khi vào lại phải quét lại.

**Impact**: UX nhẹ. Task vẫn ở `InProgress`, không mất dữ liệu backend.

**Giải pháp đề xuất**:
```dart
// Trong _ReplenishmentExecutionScreenState
@override
void initState() {
  super.initState();
  _loadSavedState();
}

Future<void> _loadSavedState() async {
  final prefs = await SharedPreferences.getInstance();
  final savedSrc = prefs.getString('repl_src_${widget.taskId}');
  if (savedSrc != null && mounted) {
    setState(() {
      _sourceBinController.text = savedSrc;
      _step = 2; // Bỏ qua step 1 nếu đã scan
    });
  }
}

void _handleHardwareScan(String code) async {
  // ... existing code ...
  if (_step == 1) {
    _sourceBinController.text = cleanCode;
    // Persist to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('repl_src_${widget.taskId}', cleanCode);
  }
}

Future<void> _submitReplenishment() async {
  // ... on success, clear persisted state ...
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('repl_src_${widget.taskId}');
}
```

---

### 2. Typed Models cho Inventory (Low priority)

**Vấn đề**: `unifiedTasksProvider` và `InventoryRepository` sử dụng `Map<String, dynamic>` raw JSON.

**Impact**: Type safety thấp, dễ runtime error nếu API thay đổi field name.

**Giải pháp**: Tạo typed DTO classes:
```dart
class ReplenishmentTaskDto {
  final String id;
  final String sku;
  final int quantity;
  final String fromBinId;
  final String toBinId;
  final String status;
  final String? assignedTo;
  final String? priority;
  final String? productName;
  final String? uom;

  const ReplenishmentTaskDto({...});

  factory ReplenishmentTaskDto.fromJson(Map<String, dynamic> json) => ...;
}

class CountTaskDto {
  final String id;
  final String binId;
  final String? sku;
  final int expectedQty;
  final int? countedQty;
  final String status;
  final String? assignedTo;
  ...
}
```

---

### 3. Inconsistent URL Paths (Low priority — chỉ là naming)

| Mobile calls | Backend route |
|---|---|
| `/inventory/tasks/replenishments/{id}/assign` | ✅ Match |
| `/inventory/tasks/replenish/{id}/start` | ✅ Match |
| `/inventory/tasks/cycle-count/{id}/assign` | ✅ Match |
| `/inventory/tasks/cycle-count/{id}/start` | ✅ Match |

> Không có bug thực tế. `replenishments` (có s) vs `replenish` (không s) là inconsistency về naming convention nhưng không gây lỗi.

---

### 4. Supervisor Approval Flow (Medium — chưa có trên Mobile)

**Vấn đề**: Backend có `POST /cycle-count/{id}/approve` nhưng chưa có màn hình supervisor trên Mobile.

**Impact**: Supervisor phải approve qua Web dashboard (nếu có), không thể approve trên PDA.

**Đề xuất**: Thêm màn hình supervisor hoặc Web admin panel cho flow này trong sprint sau.

---

### 5. Generate Tasks (chỉ có trên Backend)

**Backend** có:
- `POST /inventory/tasks/cycle-count/generate`
- `POST /inventory/tasks/replenish/generate`

**Mobile** chưa có UI để tạo task thủ công. Hiện tại task được generate bởi:
- Backend job tự động
- Dev tools / API call

---

## Gap Summary Matrix

```
Feature                              Backend  Mobile  Web    Gap
─────────────────────────────────────────────────────────────
Replenishment Execute (2-step)         ✅      ✅      —      None
Replenishment Assign/Start             ✅      ✅      —      None
Replenishment Short Replenish          ✅      ✅      —      None
Cycle Count Execute (verify+count)     ✅      ✅      —      None
Cycle Count Assign/Start               ✅      ✅      —      None
Cycle Count Ad-hoc                     ✅      ✅      —      None
Cycle Count Approve (Supervisor)       ✅      ❌      ?      Mobile gap
Generate Replenishment Tasks           ✅      ❌      ?      Mobile gap (non-critical)
Generate Count Tasks                   ✅      ❌      ?      Mobile gap (non-critical)
Replenishment State Persistence        N/A     ⚠️      —      UX improvement
Typed DTOs for Inventory               N/A     ⚠️      —      Code quality
Real-time task push (SignalR)          ✅      ✅      —      None (notifications exist)
```
