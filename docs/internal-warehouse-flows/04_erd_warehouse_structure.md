# 04 — ERD: Cấu trúc Kho (Warehouse Structure)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WAREHOUSE STRUCTURE                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│    Warehouse    │
├─────────────────┤
│ PK  Id: Guid    │
│     TenantId    │
│     Name        │
│     Code        │
│     Address     │
│     City        │
│     IsActive    │
│     CreatedAt   │
└────────┬────────┘
         │ 1
         │
         │ Has many
         │ N
┌────────▼────────┐          ┌──────────────────────────┐
│      Zone       │          │     ZoneType (Enum)       │
├─────────────────┤          ├──────────────────────────┤
│ PK  Id: Guid    │          │ Receiving                │
│ FK  WarehouseId │          │ Storage  (Bulk)          │
│     ZoneCode    │          │ Picking  (Pick Face)     │
│     ZoneName    │          │ Staging                  │
│     ZoneType ───┼──────────│ Dispatch                 │
│     IsActive    │          │ Quarantine               │
└────────┬────────┘          └──────────────────────────┘
         │ 1
         │
         │ Has many
         │ N
┌────────▼────────────────────────────────┐
│                  Bin                    │
├─────────────────────────────────────────┤
│ PK  Id: Guid                            │
│ FK  WarehouseId: Guid                   │
│ FK  ZoneId: Guid                        │
│     BinCode: string       (UNIQUE)      │
│     Aisle: string                       │
│     Rack: string                        │
│     Shelf: string                       │
│     Status: BinStatus                   │
│     CurrentOrderId: Guid?  (FK nullable)│
│     IsDeleted: bool                     │
│     DeletedAt: DateTime?                │
└────────┬────────────────────────────────┘
         │ 1
         │
         │ Has many
         │ N
┌────────▼────────────────────────────────┐
│             InventoryItem               │
├─────────────────────────────────────────┤
│ PK  Id: Guid                            │
│ FK  WarehouseId: Guid                   │
│ FK  BinId: Guid                         │
│     Sku: string                         │
│     LotNo: string?                      │
│     ExpiryDate: DateTime?               │
│     QuantityOnHand: int                 │
│     ReservedQty: int                    │
│     AvailableQty = OnHand - Reserved    │
│     LastUpdatedAt: DateTime             │
└─────────────────────────────────────────┘
         │
         │ Referenced by
         │
┌────────▼────────────────────────────────┐
│            InventoryLedger              │
├─────────────────────────────────────────┤
│ PK  Id: Guid                            │
│ FK  WarehouseId: Guid                   │
│ FK  BinId: Guid                         │
│     Sku: string                         │
│     LotNo: string?                      │
│     TransactionType: LedgerTxType       │
│     QuantityChange: int  (+/-)          │
│     ReasonCode: string                  │
│     Reference: string  (taskId/receiptId)│
│     OperatorId: string                  │
│     CreatedAt: DateTime                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         LedgerTxType (Enum)             │
├─────────────────────────────────────────┤
│ Receive         (nhận hàng vào)         │
│ PutawayIn       (cất hàng)              │
│ PickOut         (lấy hàng)              │
│ ReplenishOut    (xuất bổ sung)          │
│ ReplenishIn     (nhận bổ sung)          │
│ CycleCountAdj   (điều chỉnh kiểm kê)   │
│ TransferOut     (chuyển kho ra)         │
│ TransferIn      (chuyển kho vào)        │
│ Return          (nhận hàng trả)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           InventoryReservation          │
├─────────────────────────────────────────┤
│ PK  Id: Guid                            │
│ FK  InventoryItemId: Guid               │
│ FK  OutboundOrderId: Guid               │
│     Sku: string                         │
│     ReservedQty: int                    │
│     Status: ReservationStatus           │
│     CreatedAt: DateTime                 │
│     ReleasedAt: DateTime?               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│     InventoryReconciliationReport       │
├─────────────────────────────────────────┤
│ PK  Id: Guid                            │
│ FK  WarehouseId: Guid                   │
│     Sku: string                         │
│     BinCode: string                     │
│     SystemQtyBefore: int                │
│     CountedQty: int                     │
│     AdjustmentQty: int  (delta)         │
│     Reason: string                      │
│     OperatorId: string                  │
│     ApprovedBy: string?                 │
│     CreatedAt: DateTime                 │
│     ApprovedAt: DateTime?               │
└─────────────────────────────────────────┘
```

---

## BinStatus (Enum)

| Status | Mô tả |
|--------|-------|
| `Available` | Trống, sẵn sàng nhận hàng |
| `Occupied` | Đang có hàng |
| `Reserved` | Đang giữ cho đơn hàng cụ thể |
| `Maintenance` | Đang bảo trì |

---

## Quan hệ tóm tắt

```
Warehouse (1) ──────── (N) Zone (1) ──────── (N) Bin
                                                   │
                                      (N)──────────┤
                                   InventoryItem    │
                                                    │
                                      (N)──────────┤
                                   InventoryLedger  │
                                                    │
                              ReplenishmentTask ────┤ SourceBin + DestBin
                              CountTask        ────┤ BinId
                              PutawayTask      ────┤ TargetBin
                              PickTask         ────┤ FromBin
```

---

## Ví dụ BinCode Convention

```
[Warehouse]-[Zone]-[Aisle]-[Rack]-[Shelf]
HN1-STG-A01-R02-S03   → Kho HN1, Storage Zone, Aisle A, Rack 2, Shelf 3
HN1-PCK-B01-R01-S01   → Kho HN1, Picking Zone, Aisle B, Rack 1, Shelf 1
HN1-RCV-DOCK-01       → Kho HN1, Receiving Zone, Dock 1
```
