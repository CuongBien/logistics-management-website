# Inbound Management Implementation Tasks (Task B)

## Schema & domain (done)

- [x] **1. Define Enums in Domain Layer**
  - [x] `InboundReceiptStatus` (Draft, Pending, Receiving, Completed, CompletedWithExceptions, Closed, Cancelled)
  - [x] `InboundReceiptLineStatus` (Pending, PartiallyReceived, Quarantined, Completed)
  - [x] `PutawayStatus` (Pending, PutawayInProgress, PutawayCompleted, PutawayFailed)
  - [x] `DispositionStatus` (QuarantineEnter, TransferApproved, ScrapApproved, Released)
  - [x] `InventoryStatus` (Available, Blocked, Quarantined, Damaged)
  - [x] `BinType` (Standard, Quarantine, HoldStage, Scrap)

- [x] **2. Create/Update Entities**
  - [x] `InboundReceipt`: Add `ShipmentNo`, `SourceType`, `SourceRef`, `Status`, `ReceivedAt`
  - [x] `InboundReceiptLine`: Add `RejectedQty`, `RejectionReason`, `ShortageQty`, `Status`
  - [x] `InboundBinAllocation`: Configure `PutawayStatus`
  - [x] `DispositionLog` (Inventory Module): Soft link `InboundLineId`, map `InventoryItemId`

- [x] **3. Implement DDD Behaviors & Domain Logic**
  - [x] Implement `ForceClose()` behavior in `InboundReceiptLine` to calculate `ShortageQty`
  - [x] Implement state transition logic to `CompletedWithExceptions` when appropriate
  - [x] Add validation rules (e.g., `ReceivedQty + RejectedQty <= ExpectedQty`)

- [x] **4. Entity Framework Core Configuration**
  - [x] Configure idempotency composite unique key `UNIQUE(WarehouseId, SourceType, SourceRef, ShipmentNo)`
  - [x] Configure internal unique key `UNIQUE(ReceiptNo)`
  - [x] Configure unique key `UNIQUE(ReceiptId, LineNo)`
  - [x] Map Enums to string/int as appropriate
  - [x] Ensure `DispositionLog` does NOT generate a physical FK constraint to `InboundLineId`

- [x] **5. Database Migration**
  - [x] Run `dotnet ef migrations add InboundSchemaAndExceptions`
  - [x] Verify generated SQL snapshot matches the architectural intent

## Spec alignment & documentation

- [x] **6. Author `spec.md` and link from `plan.md`**
  - [x] Acceptance criteria mapped to `FR-*` / `SC-*` in `specs/001-inbound-schema/spec.md`
  - [x] `plan.md` references `spec.md` and lists full doc tree

## Application rules (gaps from analysis)

- [ ] **7. Bin routing & allocation enforcement (FR-010, FR-011; AC-050–AC-054)**
  - [ ] Validate `InboundBinAllocation` against `Bin.BinType` vs line/inventory status when allocating (Application or Domain service).
  - [ ] Enforce `SUM(AllocatedQty) <= ReceivedQty` on add/update allocation paths.

- [ ] **8. Lot / expiry policy (FR-012; AC-060–AC-062)**
  - [ ] Wire SKU master flags (`IsLotTracked`, `IsExpiryTracked`) into receive/line update validators or handlers.
  - [ ] Reject past `ExpiryDate` when tracking is required.

- [ ] **9. Completed receipt immutability (FR-015; AC-042, AC-080)**
  - [ ] Block receive/quantity edits when header is `Completed` or `CompletedWithExceptions` (unless explicit compensating command exists).

- [ ] **10. Disposition & encapsulation (FR-013, FR-014; AC-070–AC-072)**
  - [ ] Ensure all inventory status transitions go through `InventoryItem.ChangeStatus` and append `DispositionLog` only after success.
  - [ ] Add guardrails so application code cannot persist a `DispositionLog` without the aggregate path.

## Testing (constitution / SC coverage)

See **[test-plan.md](./test-plan.md)** for full strategy, environments, and P1/P2 matrix.

- [ ] **11. Domain unit tests** (`src/Tests/Warehouse.Api.Tests` or dedicated `Warehouse.Domain.Tests` if split later)
  - [ ] `InboundReceiptLine`: over-receive throws; `Receive` requires rejection reason when `rejectedQty > 0`; `ForceClose` sets `ShortageQty` (AC-010, AC-020, AC-030, AC-031).
  - [ ] `InboundReceipt.RecalculateStatus`: `Completed` vs `CompletedWithExceptions` (AC-040, AC-041).
  - [ ] `InventoryItem.ChangeStatus` returns `DispositionLog` with expected linkage (AC-070).

- [ ] **12. Application / handler tests**
  - [ ] `ForceCloseReceiptCommandHandler`: after successful save, `IPublishEndpoint.Publish` is invoked when `SourceRef` parses as `Guid` (SC-005).
  - [ ] `CreateInboundReceiptCommandHandler`: duplicate `(WarehouseId, SourceType, SourceRef, ShipmentNo)` returns failure (AC-001).

- [ ] **13. Integration / persistence tests**
  - [ ] Unique index violations on duplicate receipt tuple (SC-001).
  - [ ] Migration/model: no FK from `DispositionLogs.InboundLineId` to inbound lines (AC-071).

- [ ] **14. E2E or API smoke (optional but recommended for constitution)**
  - [ ] Critical inbound path: create receipt → receive line → force close → assert header status and published side effect (stub bus).

## Open decisions (from `spec.md`)

- [ ] **15. Product clarification**
  - [ ] Overage policy vs strict cap (`FR-005` / Edge case in spec) — run `/speckit-clarify` if scope changes.
  - [ ] Force-close approval SLA — only if workflow or auth rules are required.
