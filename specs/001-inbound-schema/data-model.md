# Data Model: Inbound Schema & Exceptions

## 1. Entities

### `InboundReceipt` (Header)
Represents a single inbound document (e.g., ASN from ERP).
- **Id**: `Guid` (PK)
- **WarehouseId**: `Guid` (FK)
- **ReceiptNo**: `string`
- **ShipmentNo**: `string`
- **SourceType**: `string` (e.g., "PURCHASE_ORDER", "TRANSFER")
- **SourceRef**: `string` (External reference)
- **Status**: `InboundReceiptStatus`
- **CreatedAt**: `DateTime`
- **ReceivedAt**: `DateTime?`

### `InboundReceiptLine` (Detail)
Represents a line item expected to be received, now expanded to handle rejections.
- **Id**: `Guid` (PK)
- **ReceiptId**: `Guid` (FK)
- **LineNo**: `int`
- **SkuCode**: `string`
- **Uom**: `string`
- **ExpectedQty**: `int`
- **ReceivedQty**: `int` (Good quantity available for putaway)
- **RejectedQty**: `int` (Quantity damaged or quarantined)
- **RejectionReason**: `string?` (Reason for rejection, required if RejectedQty > 0)
- **ShortageQty**: `int` (Quantity short-closed)
- **LotNo**: `string?`
- **ExpiryDate**: `DateTime?`
- **Status**: `InboundReceiptLineStatus`

### `InboundBinAllocation` (Putaway)
Tracks the physical putaway location for the *received* goods.
- **Id**: `Guid` (PK)
- **ReceiptLineId**: `Guid` (FK)
- **BinId**: `Guid` (FK)
- **AllocatedQty**: `int`
- **PutawayStatus**: `PutawayStatus`

### `DispositionLog` (Exception Tracking - Inventory Module)
*Note: This entity belongs to the Inventory Context and manages the historical lifecycle of quarantined/rejected items.*
- **Id**: `Guid` (PK)
- **InboundLineId**: `Guid` (Soft Link - Not a DB FK Constraint)
- **InventoryItemId**: `Guid` (FK)
- **InventoryStatus**: `InventoryStatus`
- **Status**: `DispositionStatus`
- **CreatedAt**: `DateTime`

---

## 2. Enums

**`InboundReceiptStatus`**
- `Draft`
- `Pending` (Ready to receive)
- `Receiving` (In progress)
- `Completed` (All lines fully received)
- `CompletedWithExceptions` (Completed but with some lines containing rejected/short quantities)
- `Closed` (Archived/Financially reconciled)
- `Cancelled`

**`InboundReceiptLineStatus`**
- `Pending`
- `PartiallyReceived`
- `Quarantined` (Waiting for QA disposition)
- `Completed`

**`PutawayStatus`**
- `Pending`
- `PutawayInProgress`
- `PutawayCompleted`
- `PutawayFailed`

**`DispositionStatus`**
- `QuarantineEnter`
- `TransferApproved`
- `ScrapApproved`
- `Released`

**`InventoryStatus`** *(Referenced by items & logs)*
- `Available`
- `Blocked`
- `Quarantined`
- `Damaged`

**`BinType`** *(Required for Bins to handle exceptions)*
- `Standard`
- `Quarantine`
- `HoldStage`
- `Scrap`

---

## 3. Database Constraints & Business Rules

1. **Unique Constraints**:
   - `InboundReceipt` (Idempotency Key): `UNIQUE(WarehouseId, SourceType, SourceRef, ShipmentNo)`
   - `InboundReceipt` (Internal Key): `UNIQUE(ReceiptNo)`
   - `InboundReceiptLine`: `UNIQUE(ReceiptId, LineNo)`

2. **Check Constraints (Qty Validation)**:
   - `ExpectedQty >= 0`
   - `ReceivedQty >= 0`
   - `RejectedQty >= 0`
   - Strict Line Rule: `ReceivedQty + RejectedQty <= ExpectedQty` (Prevents over-receiving beyond ASN without an explicit overage policy).

3. **Force Close Behavior (Shortage)**:
   - If `ReceivedQty + RejectedQty < ExpectedQty`, the line remains `PartiallyReceived`.
   - The user must explicitly issue a `Force Close` command to close the line, which will calculate and populate the `ShortageQty = ExpectedQty - (ReceivedQty + RejectedQty)`.
   - Only when all lines are completed (either naturally or via Force Close) will the header transition to `Completed` or `CompletedWithExceptions`.

4. **Putaway Allocation Rules**:
   - `AllocatedQty > 0`
   - `SUM(AllocatedQty)` across a single line MUST NOT exceed `ReceivedQty` for that line.

5. **Exception Handling Rules (DDD Encapsulation)**:
   - `InventoryItem` must own the behavior to change its status.
   - `DispositionLog` is generated as an event trail after `InventoryItem.ChangeStatus()` completes, and uses a soft-link to reference `InboundLineId`.
   - If `RejectedQty > 0`, then `RejectionReason` MUST NOT BE NULL.
   - Items with `Quarantined` or `Damaged` status MUST only be put away into Bins with matching `BinType`.
