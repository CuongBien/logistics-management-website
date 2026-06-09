# 05 — ERD: Luồng Replenishment & Inventory Movement

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      REPLENISHMENT FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  ReplenishmentTask                    │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│     TenantId: string                                 │
│ FK  WarehouseId: Guid                                │
│     Sku: string                                      │
│ FK  SourceBinId: Guid          ──────────────────────┼──▶ Bin (Source)
│ FK  DestinationBinId: Guid     ──────────────────────┼──▶ Bin (Destination)
│ FK  ActualDestinationBinId: Guid? ───────────────────┼──▶ Bin (Actual, nullable)
│     RequestedQty: int                                │
│     Status: ReplenishmentTaskStatus                  │
│     AssignedTo: string?  (Keycloak sub)              │
│     CreatedAt: DateTime                              │
│     StartedAt: DateTime?                             │
│     CompletedAt: DateTime?                           │
│     IsDeleted: bool                                  │
│     DeletedAt: DateTime?                             │
└──────────────────────────────────────────────────────┘
         │
         │ On Complete triggers
         │
         ▼
┌──────────────────────────────────────────────────────┐
│              InventoryItem (Source Bin)               │
├──────────────────────────────────────────────────────┤
│     Sku = task.Sku                                   │
│     BinId = task.SourceBinId                         │
│     QuantityOnHand  -=  RequestedQty (or actualQty)  │
└──────────────────────────────────────────────────────┘

         +

┌──────────────────────────────────────────────────────┐
│            InventoryItem (Destination Bin)            │
├──────────────────────────────────────────────────────┤
│     Sku = task.Sku                                   │
│     BinId = task.DestinationBinId                    │
│     QuantityOnHand  +=  RequestedQty (or actualQty)  │
└──────────────────────────────────────────────────────┘

         +

┌──────────────────────────────────────────────────────┐
│           InventoryLedger (2 entries)                 │
├──────────────────────────────────────────────────────┤
│ Entry 1:  REPLENISH_OUT                              │
│   BinId = SourceBinId                               │
│   QuantityChange = -RequestedQty                    │
│   Reference = taskId                                │
│                                                      │
│ Entry 2:  REPLENISH_IN                               │
│   BinId = DestinationBinId                          │
│   QuantityChange = +RequestedQty                    │
│   Reference = taskId                                │
└──────────────────────────────────────────────────────┘
```

---

## ReplenishmentTaskStatus (Enum)

```
┌─────────────────────────────────────────┐
│       ReplenishmentTaskStatus           │
├─────────────────────────────────────────┤
│ Pending    → task vừa được tạo          │
│ InProgress → đã assign + start          │
│ Completed  → confirm-replenish thành công│
│ Cancelled  → hủy bởi supervisor         │
└─────────────────────────────────────────┘
```

---

## Toàn bộ sơ đồ quan hệ (đầy đủ)

```
ErpSkuMirror
  │ Sku referenced by
  ▼
ReplenishmentTask ─── SourceBinId ───▶ Bin ◀─── Zone ◀─── Warehouse
      │           ─── DestBinId ─────▶ Bin
      │           ─── ActualDestBinId ▶ Bin?
      │
      │ AssignedTo: string (Keycloak sub)
      │    └───▶ OperatorProfile.OperatorSub
      │
      │ On Assign:
      │    └───▶ OperatorActivityLog (action: ReplenishmentAssigned)
      │
      │ On Complete:
      │    ├───▶ InventoryItem (source) qty--
      │    ├───▶ InventoryItem (dest) qty++
      │    ├───▶ InventoryLedger ×2
      │    └───▶ IntegrationEvent: ReplenishmentCompletedEvent
      │              └──▶ OMS Service (optional: restock notification)

InventoryItem ──── BinId ───▶ Bin
      │
      │ Referenced by:
      ├──▶ InventoryReservation (OutboundOrderId)
      ├──▶ InventoryLedger (audit trail)
      └──▶ InventoryReconciliationReport (cycle count result)
```

---

## API Call Chain (Mobile → Backend)

```
Mobile Action              HTTP Call                     DB Change
─────────────────────────────────────────────────────────────────
Tap "Nhận việc"    →  POST /replenishments/{id}/assign  → AssignedTo = sub
Tap "Tiến hành"    →  POST /replenish/{id}/start        → Status = InProgress
Quét src+dst bins  →  POST /qrcode/actions/             → Status = Completed
                       confirm-replenish                 → InventoryItem ×2
                       {taskId, src, dst, qty?}          → InventoryLedger ×2
```

---

## Ví dụ dữ liệu thực tế

```
ReplenishmentTask:
  Id: "abc-123"
  Sku: "SKU-LAPTOP-01"
  SourceBinId: → Bin {BinCode: "HN1-STG-A01-R03-S02"} (Bulk Storage)
  DestinationBinId: → Bin {BinCode: "HN1-PCK-B01-R01-S01"} (Pick Face)
  RequestedQty: 20
  Status: InProgress
  AssignedTo: "user-sub-keycloak-abc"

After confirm-replenish:
  InventoryItem (HN1-STG-A01-R03-S02, SKU-LAPTOP-01): 100 → 80
  InventoryItem (HN1-PCK-B01-R01-S01, SKU-LAPTOP-01):   5 → 25
  InventoryLedger[0]: {BinCode: STG-..., qty: -20, type: ReplenishOut}
  InventoryLedger[1]: {BinCode: PCK-..., qty: +20, type: ReplenishIn}
  Task.Status: Completed
  Task.ActualDestinationBinId: {BinCode: "HN1-PCK-B01-R01-S01"}
```

---

## URL không nhất quán (cần lưu ý)

| Action | Mobile gọi | Backend định nghĩa |
|--------|-----------|-------------------|
| Assign | `POST /inventory/tasks/replenishments/{id}/assign` | `POST api/inventory/tasks/replenishments/{id}/assign` ✅ |
| Start  | `POST /inventory/tasks/replenish/{id}/start` | `POST api/inventory/tasks/replenish/{id}/start` ✅ |
| Confirm | `POST /qrcode/actions/confirm-replenish` | `POST api/qrcode/actions/confirm-replenish` ✅ |

> **Chú ý**: `assign` dùng path `replenishments` (số nhiều), còn `start` dùng `replenish` (không có s). Đây là inconsistency nhẹ trong naming nhưng cả hai đều hoạt động đúng.
