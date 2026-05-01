# Post-ERP MVP 2 Sprint - Completed Work

## Scope Summary
- Completed all to-dos defined in MVP 2 sprint execution plan.
- Delivery focus: close transfer loop end-to-end first, then add minimum hardening for invariants and tenant/authz boundaries.

## Completed Items

### Sprint A - Transfer Loop and Correlation
- Standardized transfer correlation with `source_shipment_no` across API and event flow.
- Extended `ShipmentSortedIntegrationEvent` to carry:
  - `TenantId`
  - `CustomerId`
  - `SourceShipmentNo`
- Added/updated sort flow contract to include ownership + correlation context.
- Implemented ASN-style inbound pre-create on sorted shipment:
  - Added `ShipmentSortedConsumer` to auto pre-create `InboundReceipt` idempotently.
  - Enabled Warehouse consumers/endpoints in MassTransit configuration.
- Enforced explicit tenant/customer claim extraction at API boundary for inbound/outbound endpoints.
- Updated Postman collection to keep and reuse `sourceShipmentNo` through transfer flow.

### Sprint B - Minimum Hardening
- Added state/invariant guards:
  - Block double `MarkReceived()` on `InboundReceipt`.
  - Block invalid inbound quantity (`<= 0`) in `InboundItem`.
- Added command-level guardrails:
  - Validate required ownership fields in `CreateInboundReceiptCommand`.
  - Default `sourceShipmentNo` if not provided.
  - Prevent duplicate receipt creation by `OrderId + TenantId`.
  - Enforce tenant ownership on `ReceiveInboundItem`.
- Strengthened tenant/authz boundary:
  - Inbound create/receive and outbound sort now enforce token-derived tenant context.

## Tests Added
- `InboundOutboundControllerTests`
  - Missing-claim rejection.
  - Sort command ownership override from claims.
  - Receive flow tenant enforcement from claims.
- `WarehouseDomainInvariantTests`
  - Over-quantity reserve failure.
  - Invalid inbound quantity failure.

## Validation Results
- `dotnet build d:/Logistics/src/LMS.sln` passed.
- `dotnet test d:/Logistics/src/Tests/Warehouse.Api.Tests/Warehouse.Api.Tests.csproj` passed (`8/8`).
- `powershell -ExecutionPolicy Bypass -File d:/Logistics/src/run-erp-smoke.ps1` completed successfully (`[6/6] Smoke run completed`).

## Notes
- Follow-up fix prepared for `outbound/sort` API model-binding (`CustomerId` required issue):
  - Introduced API request DTO for sort endpoint.
  - Controller maps claim-based ownership into command internally.
