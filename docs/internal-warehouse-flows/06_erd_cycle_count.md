# 06 — ERD: Luồng Cycle Count & Reconciliation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CYCLE COUNT FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                     CountTask                         │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│     TenantId: string                                 │
│ FK  WarehouseId: Guid                                │
│ FK  BinId: Guid                ──────────────────────┼──▶ Bin (kệ cần đếm)
│     Sku: string                (null = đếm tất cả)   │
│     LotNo: string?                                   │
│     ExpiryDate: DateTime?                            │
│     ExpectedQty: int           (qty hệ thống)        │
│     CountedQty: int?           (qty thực tế đếm)     │
│     Status: CountTaskStatus                          │
│     AssignedTo: string?        (Keycloak sub)        │
│     CreatedAt: DateTime                              │
│     StartedAt: DateTime?       (khi verify bin)      │
│     CompletedAt: DateTime?     (khi submit count)    │
│     IsDeleted: bool                                  │
│     DeletedAt: DateTime?                             │
└──────────────────────────────────────────────────────┘
         │
         │ References
         ▼
┌──────────────────────────────────────────────────────┐
│                     Bin                               │
├──────────────────────────────────────────────────────┤
│     BinCode: string    (in QR trên kệ vật lý)        │
│     ZoneId: Guid       → Zone.ZoneType               │
│     WarehouseId: Guid                                │
└──────────────────────────────────────────────────────┘
         │
         │ Contains
         ▼
┌──────────────────────────────────────────────────────┐
│               InventoryItem(s)                        │
├──────────────────────────────────────────────────────┤
│     BinId = CountTask.BinId                          │
│     Sku = CountTask.Sku (nếu không null)             │
│     QuantityOnHand → cần khớp với CountedQty         │
└──────────────────────────────────────────────────────┘
         │
         │ After reconcile
         ▼
┌──────────────────────────────────────────────────────┐
│          InventoryReconciliationReport                │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  WarehouseId: Guid                                │
│     Sku: string                                      │
│     BinCode: string                                  │
│     SystemQtyBefore: int                             │
│     CountedQty: int                                  │
│     AdjustmentQty: int         (delta = counted - sys)│
│     Reason: string             ("PDA Cycle Count")   │
│     OperatorId: string                               │
│     ApprovedBy: string?                              │
│     CreatedAt: DateTime                              │
│     ApprovedAt: DateTime?                            │
└──────────────────────────────────────────────────────┘
         │
         │ If delta != 0
         ▼
┌──────────────────────────────────────────────────────┐
│           InventoryLedger (adjustment entry)          │
├──────────────────────────────────────────────────────┤
│     TransactionType: CycleCountAdjustment            │
│     QuantityChange: delta  (+/-)                     │
│     Reference: reconciliationReportId                │
│     OperatorId: string                               │
│     CreatedAt: DateTime                              │
└──────────────────────────────────────────────────────┘
```

---

## CountTaskStatus (Enum)

```
┌─────────────────────────────────────────┐
│           CountTaskStatus               │
├─────────────────────────────────────────┤
│ Pending   → task vừa được tạo          │
│ Counted   → đã submit số đếm           │
│ Adjusted  → supervisor đã approve điều chỉnh│
│ Cancelled → hủy                        │
└─────────────────────────────────────────┘
```

---

## Toàn bộ sơ đồ quan hệ (đầy đủ)

```
Warehouse (1) ──── (N) Zone (1) ──── (N) Bin
                                         │
                                    CountTask ──── BinId ──▶ Bin
                                         │
                                         │ AssignedTo ──▶ OperatorProfile
                                         │
                                         │ BIN VERIFY (cycle-count-start)
                                         │   └──▶ task.StartedAt = now
                                         │
                                         │ RECONCILE (/inventory/reconcile)
                                         │   ├──▶ InventoryItem.QuantityOnHand adjusted
                                         │   ├──▶ InventoryLedger (CycleCountAdj)
                                         │   ├──▶ InventoryReconciliationReport
                                         │   └──▶ IntegrationEvent: InventoryAdjustedEvent
                                         │
                                         │ APPROVE (/cycle-count/{id}/approve)
                                         │   └──▶ Status = Adjusted
                                         │        ApprovedBy recorded
                                         │
OperatorProfile ──▶ OperatorActivityLog  │
      (audit trail tất cả hành động)     │
```

---

## Vòng đời đầy đủ của CountTask

```
[Generate]
    GenerateCountTasksCommand
    → Tạo CountTask(s) dựa trên:
      - Các Bin trong kho
      - Ưu tiên theo ngày kiểm kê cuối, vùng, SKU
      - maxTasks: số lượng tối đa tạo ra
    → Status = Pending

[Assign — Dashboard]
    POST /inventory/tasks/cycle-count/{id}/assign
    → CountTask.AssignedTo = operatorSub

[Start — Dashboard]
    POST /inventory/tasks/cycle-count/{id}/start
    → CountTask.StartedAt = UtcNow (nếu chưa có)
    → Status vẫn Pending (Start không đổi status)

[Bin Verify — PDA Bước 1]
    POST /qrcode/actions/cycle-count-start
    → Validate scannedBin.BinCode == CountTask.Bin.BinCode
    → Mobile: _isBinVerified = true → unlock numpad

[Submit Count — PDA Bước 2]
    POST /inventory/reconcile
    → InventoryItem.QuantityOnHand = countedQty
    → InventoryLedger entry
    → InventoryReconciliationReport
    → CountTask.Status = Counted (qua domain event hoặc command khác)

[Approve — Web Dashboard / Supervisor]
    POST /inventory/tasks/cycle-count/{id}/approve
    → CountTask.Status = Adjusted
    → InventoryReconciliationReport.ApprovedBy = supervisorSub
```

---

## API Call Chain (Mobile → Backend)

```
Mobile Action              HTTP Call                        DB Change
──────────────────────────────────────────────────────────────────────
Tap "Nhận việc"    →  POST /cycle-count/{id}/assign         → AssignedTo = sub
Tap "Tiến hành"    →  POST /cycle-count/{id}/start          → StartedAt = now
Quét bin vật lý   →  POST /qrcode/actions/                  → validate bin
                       cycle-count-start                     → StartedAt confirmed
                       {countTaskId, scannedBin}
Nhập số đếm + ✓   →  POST /inventory/reconcile             → InventoryItem adjusted
                       {WarehouseId, Sku, BinCode,           → InventoryLedger
                        CountedQty, Reason}                  → ReconciliationReport
```

---

## Ví dụ dữ liệu thực tế

```
CountTask:
  Id: "task-456"
  BinId: → Bin {BinCode: "HN1-PCK-B01-R01-S01"}
  Sku: "SKU-LAPTOP-01"   (hoặc null = đếm tất cả)
  ExpectedQty: 25       (hệ thống nghĩ là 25)
  CountedQty: null      (chưa đếm)
  Status: Pending

After bin verify (cycle-count-start):
  task.StartedAt = 2026-06-09T09:30:00Z
  Mobile: _isBinVerified = true

After reconcile (counted = 23):
  InventoryItem (HN1-PCK-B01-R01-S01, SKU-LAPTOP-01): 25 → 23
  InventoryLedger: {qty: -2, type: CycleCountAdjustment}
  ReconciliationReport: {systemBefore: 25, counted: 23, delta: -2}

After approve (supervisor):
  task.Status = Adjusted
  report.ApprovedBy = "supervisor-sub"
  report.ApprovedAt = 2026-06-09T11:00:00Z
```
