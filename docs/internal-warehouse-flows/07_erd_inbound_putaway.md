# 07 — ERD: Nhận hàng & Cất hàng (Inbound + Putaway)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INBOUND & PUTAWAY FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                  InboundReceipt                       │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│     TenantId: string                                 │
│ FK  WarehouseId: Guid                                │
│     ReceiptNo: string           (UNIQUE)             │
│     OrderId: Guid?              (OMS OrderId, nullable)│
│     Status: ReceiptStatus                            │
│     ReceivedBy: string                               │
│     CreatedAt: DateTime                              │
│     CompletedAt: DateTime?                           │
└─────────────────┬────────────────────────────────────┘
                  │ 1
                  │ Has many lines
                  │ N
┌─────────────────▼────────────────────────────────────┐
│               InboundReceiptLine                      │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  ReceiptId: Guid                                  │
│     Sku: string                                      │
│     LotNo: string?                                   │
│     ExpiryDate: DateTime?                            │
│     ExpectedQuantity: int                            │
│     ReceivedQuantity: int       (tăng dần khi scan)  │
│     IsOverage: bool                                  │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              InboundBinAllocation                     │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  ReceiptId: Guid                                  │
│ FK  BinId: Guid                                      │
│     Sku: string                                      │
│     AllocatedQty: int                               │
│     CreatedAt: DateTime                              │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│               InboundDiscrepancy                      │
├──────────────────────────────────────────────────────┤
│ PK  Id: Guid                                         │
│ FK  ReceiptId: Guid                                  │
│     Sku: string                                      │
│     ExpectedQty: int                                 │
│     ReceivedQty: int                                 │
│     DiscrepancyQty: int         (expected - received) │
│     Reason: string?                                  │
│     CreatedAt: DateTime                              │
└──────────────────────────────────────────────────────┘

                  │ After scan-receive:
                  │ Suggests either
                  ▼
┌─────────────────────────────────┐    ┌──────────────────────────────┐
│          PutawayTask            │    │         CrossDockTask         │
├─────────────────────────────────┤    ├──────────────────────────────┤
│ PK  Id: Guid                    │    │ PK  Id: Guid                 │
│ FK  WarehouseId: Guid           │    │ FK  WarehouseId: Guid        │
│     ReceiptId: Guid?            │    │     ReceiptId: Guid?         │
│     Sku: string                 │    │     OutboundOrderId: Guid?   │
│     Quantity: int               │    │ FK  DestinationBinId: Guid   │
│ FK  SourceBinId: Guid           │    │     Status: CrossDockStatus  │
│ FK  SuggestedBinId: Guid        │    │     AssignedTo: string?      │
│     ActualBinId: Guid?          │    └──────────────────────────────┘
│     Status: PutawayStatus       │
│     AssignedTo: string?         │
│     LotNo: string?              │
│     CreatedAt: DateTime         │
│     CompletedAt: DateTime?      │
└─────────────────────────────────┘
         │
         │ On confirm-putaway
         ▼
   InventoryItem (SuggestedBin or ActualBin)
   InventoryLedger (PutawayIn entry)
```

---

## ReceiptStatus (Enum)

| Status | Mô tả |
|--------|-------|
| `Draft` | Mới tạo, chưa nhận |
| `Receiving` | Đang nhận hàng |
| `PartiallyReceived` | Nhận một phần |
| `Received` | Đã nhận đủ |
| `Completed` | Hoàn tất (putaway xong) |
| `Cancelled` | Hủy |

---

## PutawayStatus (Enum)

| Status | Mô tả |
|--------|-------|
| `Pending` | Chờ nhân viên nhận |
| `InProgress` | Đang thực hiện |
| `Completed` | Đã cất xong |
| `Cancelled` | Hủy |

---

## Luồng Inbound đầy đủ

```
ERP creates PO
      │
      ▼ (via InboundController)
InboundReceipt (Status: Draft)
InboundReceiptLine × N
      │
      ▼ (PDA: scan-receive)
POST /qrcode/actions/scan-receive
  {receiptId, scannedSku, scannedBin, quantity}
      │
      ├── ReceivedQuantity += quantity
      │
      ├── If SKU belongs to outbound order
      │   └── Create CrossDockTask
      │
      └── Else
          └── Create PutawayTask (suggestedBinId = intelligent bin selection)
                  │
                  ▼ (PDA: confirm-putaway)
          POST /qrcode/actions/confirm-putaway
            {taskId, scannedBin}
                  │
                  └── InventoryItem.qty += putaway.Quantity
                      InventoryLedger (PutawayIn)
                      PutawayTask.Status = Completed
                      Bin.Status = Occupied
```

---

## Quan hệ tổng thể Inbound

```
OMS Order ──────────────────────────────────────▶ InboundReceipt
                                                        │
                                             ┌──────────┼────────────┐
                                             │          │            │
                                             ▼          ▼            ▼
                                    ReceiptLine    BinAllocation  Discrepancy
                                             │
                                    scan-receive
                                             │
                          ┌──────────────────┴───────────────────┐
                          ▼                                       ▼
                   PutawayTask                            CrossDockTask
                          │                                       │
                   confirm-putaway                        confirm-crossdock
                          │                                       │
                   InventoryItem++                        InventoryItem → staging
                   InventoryLedger                        (để giao ngay cho đơn)
```
