# Functional Analysis

## 1) Core Actors
- End user/customer (places and tracks orders)
- Warehouse operations (inventory updates and reservation)
- System services (async processing, notification)

## 2) Primary Use Cases

### UC-01: Create Order
**Input:** customer info, address, product lines
**Output:** new order ID and initial status
**Post-condition:** order created, domain event emitted

### UC-02: View Order
**Input:** order ID
**Output:** order details + status timeline

### UC-03: Confirm Order
**Input:** order ID
**Output:** status update to confirmed (when valid)

### UC-04: Cancel Order
**Input:** order ID
**Output:** order cancelled (when allowed)

### UC-05: Create Inventory Item
**Input:** SKU and stock info
**Output:** inventory record created

### UC-06: Reserve Inventory
**Input:** order-related reservation request
**Output:** reservation success/failure event

## 3) Business States (Order)
Expected progression includes states such as:
- New
- Confirmed
- Allocated / Reservation-in-progress
- Completed
- Cancelled or Faulted

## 4) Integration Scenario: Order-to-Reservation
1. OMS receives create order request.
2. OMS emits order-created integration event.
3. WMS consumes event and reserves stock.
4. WMS emits reserved or reservation-failed event.
5. Saga updates orchestration state.
6. Notification service pushes realtime updates.

## 5) Non-Functional Requirements (Observed)
- Scalability through service decomposition.
- Reliability via outbox and async events.
- Security via centralized identity.
- Operability via logs/traces/health checks.

## 6) Gaps for Next Iteration
- Add formal SLA and error budget definitions.
- Add contract tests between OMS and WMS.
- Add role matrix and permission mapping document.
- Add sequence diagrams for all high-risk flows.
