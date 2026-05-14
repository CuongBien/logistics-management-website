# Implementation Plan: Inbound Schema & Exceptions

**Branch**: `001-inbound-schema` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Base breakdown plan + DDD Architecture Consultation.

## Summary

Implement the database schema for the Inbound Management flow (Task B), focusing on the `InboundReceipt`, `InboundReceiptLine`, `InboundBinAllocation`, and exception handling using `DispositionLog` (Inventory module). Establish clear State Machine transitions and `ForceClose` behaviors.

## Technical Context

**Language/Version**: C# / .NET 8
**Primary Dependencies**: Entity Framework Core, PostgreSQL, MassTransit
**Storage**: PostgreSQL (`lms_wms_dev`)
**Testing**: xUnit, Moq
**Target Platform**: Linux container (Docker)
**Project Type**: Backend Microservice (Warehouse.Api)
**Constraints**: Must adhere to DDD principles, specifically Encapsulation for Domain models.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Commit Conventions**: Verified (Using Conventional Commits)
- **Code Quality**: Verified (Using Domain-Driven Design patterns)
- **Testing Standards**: Verified (Unit testing invariants required)
- **User Experience**: N/A for Backend

## Project Structure

### Documentation (this feature)

```text
specs/001-inbound-schema/
├── spec.md
├── plan.md
├── data-model.md
├── tasks.md
├── test-plan.md       # QA / dev test strategy (this plan output)
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/Services/Warehouse/Warehouse.Domain/
├── Entities/
│   ├── InboundReceipt.cs
│   ├── InboundReceiptLine.cs
│   ├── InboundBinAllocation.cs
│   └── DispositionLog.cs
└── Enums/
    ├── InboundReceiptStatus.cs
    ├── InboundReceiptLineStatus.cs
    ├── PutawayStatus.cs
    ├── DispositionStatus.cs
    ├── InventoryStatus.cs
    └── BinType.cs

src/Services/Warehouse/Warehouse.Infrastructure/
└── Persistence/
    └── Configurations/
        ├── InboundReceiptConfiguration.cs
        ├── InboundReceiptLineConfiguration.cs
        ├── InboundBinAllocationConfiguration.cs
        └── DispositionLogConfiguration.cs
```

**Structure Decision**: Standard Clean Architecture layout under `Warehouse.Domain` and `Warehouse.Infrastructure`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| DispositionLog soft link | Avoid hard DB FK between Inbound and Inventory Contexts | Hard FK creates tight coupling and violates Bounded Context independence |
