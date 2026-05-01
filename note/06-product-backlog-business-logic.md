# Product Backlog (Business Logic Only)

> Scope: only business functions and process rules (no technical tasks).

## Priority Legend
- **P1** = must-have for core operation
- **P2** = should-have for stable operation
- **P3** = good-to-have enhancement

---

## 1) Module: Order Management (OMS)

- [ ] **P1 - Create order**  
  Capture sender/receiver, order lines, service options, and initialize order state.
- [ ] **P1 - Validate order eligibility**  
  Reject invalid order data and unsupported service combinations before processing.
- [ ] **P1 - View order details**  
  Allow users to view full order information and current lifecycle status.
- [ ] **P1 - Confirm order**  
  Move order from new to confirmed when prerequisites are met.
- [ ] **P1 - Cancel order**  
  Allow cancellation only in allowed stages and preserve cancellation reason.
- [ ] **P1 - Enforce order state transitions**  
  Ensure each status change follows business rules (no illegal jumps).
- [ ] **P2 - Handle delivery failure and retry**  
  Record failure reason, increment delivery attempts, and support re-dispatch flow.
- [ ] **P2 - Complete order closure**  
  Mark order completed only when final delivery conditions are satisfied.

---

## 2) Module: Inbound Management (Warehouse Receiving)

- [ ] **P1 - Create inbound plan (ASN / inbound request)**  
  Register expected inbound goods before physical arrival.
- [ ] **P1 - Check-in arrival and assign receiving dock**  
  Record vehicle arrival and route it to the correct receiving point.
- [ ] **P1 - Receive and verify goods**  
  Compare actual received quantity/condition versus expected plan.
- [ ] **P1 - Record discrepancy handling**  
  Capture overage, shortage, and damage outcomes for each inbound line.
- [ ] **P1 - Execute putaway**  
  Move received goods to valid storage locations and confirm completion.
- [ ] **P2 - Close inbound receipt**  
  Finalize inbound transaction and make stock available for fulfillment.

---

## 3) Module: Inventory Management (WMS)

- [ ] **P1 - Create inventory item (SKU master in warehouse context)**  
  Register SKU with initial stock handling properties.
- [ ] **P1 - Maintain on-hand / reserved / available quantities**  
  Keep accurate quantities after every reservation, release, and deduction.
- [ ] **P1 - Reserve stock for order fulfillment**  
  Reserve inventory per order demand and prevent overselling.
- [ ] **P1 - Release reservation**  
  Return reserved quantity to available stock when order is canceled/failed.
- [ ] **P1 - Confirm stock deduction at shipping**  
  Deduct physical stock when outbound handover is confirmed.
- [ ] **P2 - Restock flow**  
  Increase available stock based on inbound completion or approved returns.
- [ ] **P2 - Inventory visibility by SKU**  
  Provide real-time stock status for operations and customer lookup.

---

## 4) Module: Outbound Fulfillment B2C (E-commerce)

- [ ] **P1 - Intake multi-channel customer orders**  
  Receive and normalize orders from different sales channels.
- [ ] **P1 - Allocate stock to B2C orders**  
  Lock stock for each order before picking starts.
- [ ] **P1 - Plan picking waves/batches**  
  Group compatible orders for efficient picking execution.
- [ ] **P1 - Execute picking and confirmation**  
  Confirm picked quantities per order line.
- [ ] **P1 - Packing and shipment readiness**  
  Validate packed contents and mark order ready for dispatch.
- [ ] **P1 - Handover to last-mile carrier**  
  Transfer shipment custody and update order to shipped.

---

## 5) Module: Outbound Fulfillment B2B (Wholesale/Distribution)

- [ ] **P1 - Process bulk outbound orders**  
  Support pallet/case-level fulfillment for large-volume orders.
- [ ] **P1 - Allocate by business constraints**  
  Allocate inventory using lot/date/customer policy requirements.
- [ ] **P1 - Execute bulk picking and staging**  
  Pick full units and stage by customer shipment.
- [ ] **P1 - Apply value-added handling requests**  
  Support relabel/repack/kitting requirements before dispatch.
- [ ] **P1 - Build shipment loads**  
  Consolidate multiple handling units into transport-ready shipments.
- [ ] **P1 - Dispatch with proof of handover**  
  Confirm shipment release to transport and close outbound operation.

---

## 6) Module: Transportation & Delivery Lifecycle

- [ ] **P1 - Manage pickup event**  
  Record that goods are collected from sender/source.
- [ ] **P1 - Manage warehouse receipt event**  
  Record handover into warehouse in transit journey.
- [ ] **P1 - Manage sorting and dispatch event**  
  Move shipment to outbound transport stage.
- [ ] **P1 - Manage delivery completion event**  
  Record successful final delivery with completion evidence.
- [ ] **P1 - Manage delivery failure event**  
  Capture failure reason and route to retry/return decision.
- [ ] **P2 - End-to-end shipment tracking timeline**  
  Provide chronological status history to internal and external users.

---

## 7) Module: Reverse Logistics (Returns/RMA)

- [ ] **P1 - Create return authorization (RMA)**  
  Register approved return with return reason and expected quantity.
- [ ] **P1 - Receive returned goods into quarantine**  
  Separate returned goods from sellable inventory on arrival.
- [ ] **P1 - Inspect return condition**  
  Assess quality and classify condition outcome.
- [ ] **P1 - Apply disposition decision**  
  Decide restock, refurbish, return-to-supplier, or liquidate.
- [ ] **P1 - Execute financial closure trigger**  
  Mark return outcome to support refund/charge rules.
- [ ] **P2 - Close return case**  
  Complete RMA lifecycle with auditable final status.

---

## 8) Module: Customer & Partner Service

- [ ] **P1 - Order status inquiry**  
  Let customers and partners view current order/shipment status.
- [ ] **P1 - Real-time status notifications**  
  Notify users when key lifecycle milestones change.
- [ ] **P2 - Issue handling workflow**  
  Register and track customer issues (delay, damage, mismatch).
- [ ] **P2 - SLA exception visibility**  
  Show delayed/failed cases requiring service intervention.

---

## 9) Module: Billing, COD & Settlement

- [ ] **P1 - Calculate service charges per order/shipment**  
  Apply agreed pricing rules for logistics services.
- [ ] **P1 - COD settlement lifecycle**  
  Track COD collected, reconciliation, and payout status.
- [ ] **P2 - Return-related financial adjustments**  
  Apply fee reversals/extra charges according to return outcomes.
- [ ] **P2 - Dispute and adjustment handling**  
  Manage correction workflow for billing mismatches.

---

## 10) Module: Operational Control & KPI

- [ ] **P2 - Fulfillment performance metrics**  
  Measure cycle times from order intake to dispatch.
- [ ] **P2 - Delivery performance metrics**  
  Track on-time delivery, failure rate, and retry ratio.
- [ ] **P2 - Inventory quality metrics**  
  Monitor stock accuracy, reservation reliability, and aging.
- [ ] **P3 - Service quality dashboard**  
  Provide consolidated KPI view by customer/module/time period.

---

## Suggested Execution Order (Business-first)

1. **P1 Core Flow:** Order Management → Inventory Management → Outbound B2C → Transportation Events  
2. **P1 Expansion:** Inbound Management → Reverse Logistics → B2B Outbound  
3. **P2/P3 Optimization:** Customer service enhancements, billing refinement, KPI analytics
