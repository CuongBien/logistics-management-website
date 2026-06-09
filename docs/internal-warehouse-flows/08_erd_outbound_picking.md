# 08 — ERD: Xuất hàng & Lấy hàng (Outbound + Picking)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                   OUTBOUND & PICKING FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                   OutboundOrder                       │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│     TenantId: string                                 │
│ FK  WarehouseId: Guid                                │
│     OrderId: Guid               (OMS OrderId)        │
│     OrderNo: string             (UNIQUE, vận đơn)    │
│     Status: OutboundOrderStatus                      │
│     DestinationAddress: string                       │
│     DestinationCity: string                          │
│     Carrier: string?                                 │
│     PartnerId: string?                               │
│     CreatedAt: DateTime                              │
└────────────────┬─────────────────────────────────────┘
                 │ 1
                 │ Has many
                 │ N
┌────────────────▼─────────────────────────────────────┐
│               OutboundOrderLine                       │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  OutboundOrderId: Guid                            │
│     Sku: string                                      │
│     RequestedQty: int                                │
│     PickedQty: int              (tăng khi confirm-pick)│
│     PackedQty: int              (tăng khi verify-pack)│
└────────────────┬─────────────────────────────────────┘
                 │
                 │ N PickTasks per line (split picking)
                 ▼
┌──────────────────────────────────────────────────────┐
│                    PickTask                           │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  WaveId: Guid                                     │
│ FK  OutboundOrderLineId: Guid                        │
│ FK  FromBinId: Guid             ──────────────────────┼──▶ Bin (Pick Face)
│     Sku: string                                      │
│     Quantity: int                                    │
│     Status: PickTaskStatus                           │
│     AssignedTo: string?                              │
│     CompletedAt: DateTime?                           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                     Wave                              │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  WarehouseId: Guid                                │
│     WaveNo: string              (UNIQUE)             │
│     Type: WaveType              (SingleOrder, Multi, Batch)│
│     Status: WaveStatus                               │
│     OrderCount: int                                  │
│     AssignedTo: string?                              │
│     CreatedAt: DateTime                              │
│     StartedAt: DateTime?                             │
│     CompletedAt: DateTime?                           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               PackVerification                        │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  OutboundOrderId: Guid                            │
│     Sku: string                                      │
│     ScannedQty: int             (tích lũy khi scan)  │
│     OperatorId: string                               │
│     LastUpdatedAt: DateTime                          │
└──────────────────────────────────────────────────────┘
```

---

## OutboundOrderStatus (Enum)

| Status | Mô tả | Transition |
|--------|-------|-----------|
| `New` | Mới nhận từ OMS | → Allocated |
| `Allocated` | Đã phân bổ tồn kho | → Picking |
| `Picking` | Đang lấy hàng | → Picked / PartiallyPicked |
| `PartiallyPicked` | Lấy một phần | → Picking |
| `Picked` | Đã lấy đủ | → Packing |
| `Packing` | Đang đóng gói | → Packed |
| `Packed` | Đã đóng gói | → Shipped |
| `Shipped` | Đã xuất kho | Terminal |
| `Cancelled` | Hủy | Terminal |

---

## WaveStatus (Enum)

| Status | Mô tả |
|--------|-------|
| `Created` | Vừa tạo |
| `Allocated` | Đã phân bổ |
| `New` | Sẵn sàng nhận |
| `Picking` | Đang lấy hàng |
| `Completed` | Hoàn tất |
| `Cancelled` | Hủy |

---

## Shipment ERD

```
┌──────────────────────────────────────────────────────┐
│                   Shipment                            │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  WarehouseId: Guid                                │
│     ShipmentNo: string          (UNIQUE)             │
│     Carrier: string                                  │
│     DestinationId: string                            │
│     DestinationType: string     (Warehouse/Customer) │
│     Status: ShipmentStatus                           │
│     CreatedAt: DateTime                              │
│     DispatchedAt: DateTime?                          │
└──────────────────────────────────────────────────────┘
         │ N
         │ Contains
         │ N (many-to-many via ShipmentOrder)
┌────────▼─────────────────────────────────────────────┐
│               ShipmentOrder (junction)                │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  ShipmentId: Guid                                 │
│ FK  OutboundOrderId: Guid                            │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               OutboundReturn                          │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  OriginalOrderId: Guid                            │
│ FK  WarehouseId: Guid                                │
│     ReturnNo: string                                 │
│     Sku: string                                      │
│     Quantity: int                                    │
│     Reason: string                                   │
│     Status: ReturnStatus                             │
│     CreatedAt: DateTime                              │
└──────────────────────────────────────────────────────┘
```

---

## Luồng Outbound đầy đủ

```
OMS Order Created
      │
      ▼
OutboundOrder (Status: New)
OutboundOrderLine × N
      │
      ▼ (allocate inventory)
InventoryReservation × N
OutboundOrder.Status = Allocated
      │
      ▼ (create wave)
Wave (contains multiple OutboundOrders)
PickTask × N (per line, per bin)
Wave.Status = New/Created
      │
      ▼ (PDA: assign + start wave)
Wave.AssignedTo = operatorSub
Wave.Status = Picking
      │
      ▼ (PDA: confirm-pick for each PickTask)
POST /qrcode/actions/confirm-pick
  {pickTaskId, scannedBin, scannedSku, quantity?}
      │
      ├── Validate: bin + sku match
      ├── InventoryItem.qty -= pickedQty
      ├── InventoryLedger (PickOut)
      ├── OutboundOrderLine.PickedQty += qty
      └── PickTask.Status = Completed
            │
            ▼ (when all lines picked)
   OutboundOrder.Status = Picked/PartiallyPicked
            │
            ▼ (PDA: verify-pack)
POST /qrcode/actions/verify-pack
  {outboundOrderId, scannedSku, quantity}
            │
            ├── PackVerification.ScannedQty accumulate
            └── When all verified:
                OutboundOrder.Status = Packed
                        │
                        ▼ (PDA: scan-sort)
                POST /qrcode/actions/scan-sort
                Shipment created/found
                ShipmentOrder created
                        │
                        ▼ (PDA: scan-load)
                POST /qrcode/actions/scan-load
                Shipment.Status = Loading
                        │
                        ▼ (PDA: ship-and-release)
                POST /qrcode/actions/ship-and-release
                OutboundOrder.Status = Shipped
                Bin.CurrentOrderId = null (released)
                Shipment.Status = Dispatched
```

---

## TransitDiscrepancy

```
┌──────────────────────────────────────────────────────┐
│              TransitDiscrepancy                       │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  ShipmentId: Guid                                 │
│ FK  OutboundOrderId: Guid                            │
│ FK  WarehouseId: Guid           (điểm nhận)          │
│     Sku: string                                      │
│     ShippedQty: int                                  │
│     ReceivedQty: int                                 │
│     DiscrepancyQty: int         (shortage)           │
│     CreatedAt: DateTime                              │
└──────────────────────────────────────────────────────┘
```
