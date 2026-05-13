# Feature Specification: Inbound Schema & Exceptions

**Feature Directory**: `specs/001-inbound-schema`
**Branch**: `001-inbound-schema`
**Created**: 2026-05-07
**Related Artifacts**: `plan.md`, `data-model.md`, `tasks.md`
**Status**: Draft (focus: Acceptance Criteria for Inbound flow)

## Overview

The Inbound flow governs how the warehouse receives goods against an external source document (Purchase Order, Transfer Order, Sales Return). The flow must support standard receiving, partial receiving, rejection of damaged or quarantined goods, explicit short-close of incomplete shipments, and putaway into bins that match the inventory state. The schema also captures an audit trail of disposition decisions for goods that enter quarantine or damaged status.

## Goals

- Provide a reliable, idempotent record of every inbound receipt against an external source document.
- Make exception handling (rejected, quarantined, short-closed quantities) first-class, not an afterthought.
- Enforce DDD encapsulation: state changes occur through domain behavior, not through audit logs.
- Enable downstream finance, QA, and inventory processes to react to receipt outcomes.

## Non-Goals

- Real-time integration code with ERP (covered by Inbound integration feature).
- Putaway optimization or slotting algorithms.
- Cross-warehouse transfer orchestration.
- UI/UX implementation details.

## Actors

- **Warehouse Operator**: Records received quantities, rejected quantities, and triggers force close.
- **QA Officer**: Decides disposition for quarantined or damaged items.
- **Receiving Supervisor**: Approves force close and reviews exception receipts.
- **External System (ERP/OMS)**: Pushes inbound source documents and consumes completion events.

## User Scenarios

### Scenario 1: Standard full receive

An operator receives a shipment that matches the expected quantities exactly. The receipt closes automatically without exceptions.

### Scenario 2: Partial receive with shortage

The carrier delivers fewer units than expected. The operator records what arrived. The line stays open until the supervisor explicitly issues a force close, which records a shortage quantity.

### Scenario 3: Receive with rejection

Some units arrive damaged. The operator records them as rejected with a mandatory reason. Rejected units flow into quarantine bins, not standard bins, and a disposition record is created.

### Scenario 4: Idempotent retry from ERP

ERP retries an already-delivered create-receipt event due to a transient failure. The system rejects the duplicate at the database level without creating a second receipt.

### Scenario 5: QA disposition of quarantined goods

A QA officer reviews quarantined items and decides to scrap, transfer, or release them. Each decision produces an immutable disposition log entry linked back to the originating inbound line via a soft reference.

## Functional Requirements

- **FR-001**: The system shall create exactly one inbound receipt per unique combination of `WarehouseId`, `SourceType`, `SourceRef`, `ShipmentNo`.
- **FR-002**: The system shall assign an internal `ReceiptNo` that is unique within the warehouse domain.
- **FR-003**: The system shall record per-line expected, received, rejected, and shortage quantities.
- **FR-004**: The system shall require a non-empty rejection reason whenever rejected quantity is greater than zero.
- **FR-005**: The system shall reject any operation that causes `ReceivedQty + RejectedQty` to exceed `ExpectedQty` for a line.
- **FR-006**: The system shall compute and persist `ShortageQty` only as a result of an explicit force close command.
- **FR-007**: The system shall transition a line to `Completed` only when `ReceivedQty + RejectedQty + ShortageQty == ExpectedQty`.
- **FR-008**: The system shall transition a receipt header to `Completed` when all lines are completed without exceptions.
- **FR-009**: The system shall transition a receipt header to `CompletedWithExceptions` when all lines are completed and at least one line has rejected or shortage quantity greater than zero.
- **FR-010**: The system shall route received units into bins whose `BinType` matches the unit's inventory status (`Standard` for available, `Quarantine` for quarantined, `Scrap` for damaged, `HoldStage` for transient holds).
- **FR-011**: The system shall ensure `SUM(AllocatedQty)` per line never exceeds the line's `ReceivedQty`.
- **FR-012**: The system shall allow `LotNo` and `ExpiryDate` to be null at the database level, while domain policy may enforce them per SKU.
- **FR-013**: The system shall record disposition decisions in the Inventory context, linking back to the originating inbound line via a soft reference (no physical foreign key).
- **FR-014**: The system shall change inventory item status only through the `InventoryItem` aggregate; `DispositionLog` shall not mutate state.
- **FR-015**: The system shall preserve all completed and exception-bearing receipts as immutable history; further mutation requires a separate compensating workflow.

## Acceptance Criteria (Primary Focus)

Each criterion is written in Given/When/Then form for direct test mapping.

### Idempotency and uniqueness

- **AC-001** (FR-001): Given a receipt already exists for `(WarehouseId=W1, SourceType=PURCHASE_ORDER, SourceRef=PO-100, ShipmentNo=S1)`, when an external system requests creation with the same tuple, then the system shall reject the request with a uniqueness violation and shall not create a duplicate receipt.
- **AC-002** (FR-002): Given `ReceiptNo=INB-001` exists, when a new receipt is created, then the system shall not allow `ReceiptNo=INB-001` to be reused.
- **AC-003** (FR-001): Given two receipts with the same `SourceRef` but different `ShipmentNo`, when both are created, then both shall be accepted as distinct receipts.

### Quantity invariants

- **AC-010** (FR-005): Given a line with `ExpectedQty=100`, `ReceivedQty=80`, when the operator attempts to set `RejectedQty=30`, then the system shall reject the update because `80 + 30 > 100`.
- **AC-011** (FR-005): Given a line with `ExpectedQty=100`, `ReceivedQty=70`, when the operator sets `RejectedQty=30`, then the update shall succeed and the line shall transition toward completion.
- **AC-012** (FR-003, FR-007): Given a line with `ExpectedQty=50`, when the operator records `ReceivedQty=50` and `RejectedQty=0`, then the line status shall become `Completed` automatically.

### Rejection and reason

- **AC-020** (FR-004): Given a line update with `RejectedQty>0`, when `RejectionReason` is null or empty, then the system shall reject the update.
- **AC-021** (FR-004): Given a valid update with `RejectedQty=5` and `RejectionReason="Wet packaging"`, when persisted, then both values shall be stored on the `InboundReceiptLine` and returned by read APIs (receipt/line queries); disposition history remains separate on `DispositionLog` when QA/inventory actions apply.

### Force close and shortage

- **AC-030** (FR-006, FR-007): Given a line with `ExpectedQty=100`, `ReceivedQty=70`, `RejectedQty=10`, when the supervisor issues `ForceClose`, then the system shall set `ShortageQty=20` and transition the line to `Completed`.
- **AC-031** (FR-006): Given a line that already has `ReceivedQty + RejectedQty == ExpectedQty`, when `ForceClose` is issued, then the system shall reject the command because there is no shortage to record.
- **AC-032** (FR-007): Given a line with shortage, when the line is partially received with no force close, then the line shall remain in `PartiallyReceived` status and the receipt header shall not auto-complete.

### Header lifecycle

- **AC-040** (FR-008): Given all lines on a receipt are `Completed` with `RejectedQty=0` and `ShortageQty=0`, when the last line completes, then the receipt status shall transition to `Completed`.
- **AC-041** (FR-009): Given all lines on a receipt are `Completed` and at least one line has `RejectedQty>0` or `ShortageQty>0`, when the last line completes, then the receipt status shall transition to `CompletedWithExceptions`.
- **AC-042**: Given a receipt with status `Completed` or `CompletedWithExceptions`, when an operator attempts to modify a line, then the system shall reject the modification.

### Putaway and bin routing

- **AC-050** (FR-010): Given a received unit with inventory status `Available`, when allocated, then it shall be allocated only to a bin with `BinType=Standard`.
- **AC-051** (FR-010): Given a received unit with inventory status `Quarantined`, when allocated, then it shall be allocated only to a bin with `BinType=Quarantine`.
- **AC-052** (FR-010): Given a received unit with inventory status `Damaged`, when allocated, then it shall be allocated only to a bin with `BinType=Scrap`.
- **AC-053** (FR-011): Given a line with `ReceivedQty=50`, when allocations sum to 60, then the system shall reject the new allocation that exceeds 50.
- **AC-054** (FR-011): Given a line with `ReceivedQty=50` and existing allocations summing to 30, when a new allocation of 20 is added, then the system shall accept it and total allocation shall be exactly 50.

### Lot and expiry policy

- **AC-060** (FR-012): Given an SKU with `IsLotTracked=false`, when a line is recorded with `LotNo=null`, then the system shall accept it.
- **AC-061** (FR-012): Given an SKU with `IsLotTracked=true`, when a line is recorded with `LotNo=null`, then the domain shall reject the operation at the application layer.
- **AC-062** (FR-012): Given an SKU with `IsExpiryTracked=true`, when a line is recorded with `ExpiryDate` in the past, then the system shall reject the operation at the application layer.

### Disposition and DDD encapsulation

- **AC-070** (FR-014): Given a quarantined item, when QA changes its status, then the change shall happen via `InventoryItem.ChangeStatus(...)` and a `DispositionLog` shall be written only after the change succeeds.
- **AC-071** (FR-013): Given a `DispositionLog` referencing `InboundLineId`, when the inbound module is queried, then the soft link shall resolve, but no database foreign key constraint shall exist between the two.
- **AC-072** (FR-014): Given any caller, when the caller attempts to mutate inventory state by writing a `DispositionLog` directly, then the system shall not allow the state change to occur.

### Immutability of completed receipts

- **AC-080** (FR-015): Given a receipt in `Completed` or `CompletedWithExceptions`, when an operator attempts a quantity edit, then the system shall reject the edit and require a compensating workflow.

## Edge Cases

- Carrier delivers more than expected without an overage policy: system rejects and surfaces an error; operator must coordinate with purchasing.
- ERP sends out-of-order events (line update before header create): system rejects until the parent header exists.
- Quarantine bin capacity exceeded: putaway is rejected; operator must escalate.
- Lot number is reused across SKUs: allowed; uniqueness applies only within the SKU scope.
- Force close is requested on a line with `ReceivedQty=0` and `RejectedQty=0`: allowed; entire `ExpectedQty` becomes `ShortageQty` and line completes.

## Success Criteria

- **SC-001**: 100% of duplicate ERP create-receipt events are blocked at the persistence layer (idempotency violation count == duplicate event count).
- **SC-002**: 0 receipts can be transitioned to `Completed` while `ReceivedQty + RejectedQty + ShortageQty != ExpectedQty` (verified by automated invariant tests).
- **SC-003**: 0 disposition log entries exist that were created without a preceding `InventoryItem.ChangeStatus` call (verified by domain test and audit query).
- **SC-004**: 100% of putaway allocations are placed in bins whose `BinType` matches the unit's inventory status (verified by integration test).
- **SC-005**: Force close emits a domain event that downstream finance and reconciliation services can consume.

## Key Entities (Business View)

- **Inbound Receipt**: A document representing one shipment expected from a known source.
- **Inbound Receipt Line**: One SKU/UOM expectation within a receipt, including received, rejected, and shortage figures.
- **Inbound Bin Allocation**: The placement of received units into a specific physical bin.
- **Disposition Log** (Inventory): An immutable history record of decisions made on quarantined or damaged items.

## Assumptions

- Master data (SKU policy flags, bins, warehouses) exists and is queryable.
- Receipt numbering is generated by the WMS, not by external systems.
- External systems use a stable `(SourceType, SourceRef, ShipmentNo)` triple per logical shipment.
- Compensating workflows for closed receipts are out of scope for this feature.

## Dependencies

- Inventory context must expose `InventoryItem.ChangeStatus` and emit corresponding domain events.
- Bin master data must include `BinType` classification.
- SKU master data must expose `IsLotTracked` and `IsExpiryTracked` flags.

## Out of Scope

- ERP integration adapters and event mapping.
- Receiving UI screens.
- Putaway optimization heuristics.
- Cycle counting and inventory reconciliation flows.

## Open Items

- Confirm whether overage handling will be added in a future feature (currently strictly forbidden by FR-005).
- Confirm SLA targets for force close approval workflow.

## Traceability

- Plan: `specs/001-inbound-schema/plan.md`
- Data Model: `specs/001-inbound-schema/data-model.md`
- Tasks: `specs/001-inbound-schema/tasks.md`
- Test plan: `specs/001-inbound-schema/test-plan.md`
