# Phase C1 Verification Evidence (Docker)

## 1) Stabilization gate (B2) - 3/3 E2E green

- Command: `npx --yes newman run docs/postman/LMS_E2E_Collection.postman_collection.json --env-var "token=<runtime-token>"`
- Result: 3 consecutive runs passed (`31 assertions`, `0 failed` each run).
- Note: `STEP 1` now accepts `201` create response, and token is injected at runtime (no hard-coded expired JWT).

## 2) Actor stamping validation

- Query (OMS): `SELECT "CreatedByOperatorId", "UpdatedByOperatorId" FROM "Orders" WHERE "Id" = '<ORDER_ID>';`
- Observed on sample order `3d2d0205-7f43-4116-bba9-d799fa599dc4`:
  - `CreatedByOperatorId = f5ff40ae-0269-4f52-b96a-5d9093f780ef`
  - `UpdatedByOperatorId = f5ff40ae-0269-4f52-b96a-5d9093f780ef`

## 3) B1 parity lock

- `Orders`: `7`
- `OrderConsignees`: `7`
- `orphan_consignees`: `0`
- `orders_without_consignee`: `0`

## 4) Replay/idempotency proof

Sample order: `3d2d0205-7f43-4116-bba9-d799fa599dc4`

- Before duplicate sort:
  - `InboundReceipts` count = `1`
  - `OrderStatusHistories` count = `4`
- Duplicate sort attempts:
  - `sort1-status:400`
  - `sort2-status:400`
- After duplicate sort:
  - `InboundReceipts` count = `1` (unchanged)
  - `OrderStatusHistories` count = `4` (unchanged)

Additional log evidence (Warehouse):
- `Inbound receipt already exists ... Skip duplicate pre-create.` for repeated `OrderId`.

## 5) C1 observability baseline

- Queue depth command:
  - `docker exec lms-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged`
  - Current output shows all tracked queues at `0/0`.
- ERP sync lag command:
  - query in `docs/RUNBOOK.md` section `C1 metric baseline`
  - current lag observed around single-digit seconds.
