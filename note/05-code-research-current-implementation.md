# Detailed Code Research - Current Microservices Implementation

Date: 2026-03-26  
Scope: Code actually present in branch `violet` (not only conceptual docs)

---

## 1) Executive Summary

Hệ thống hiện tại đã triển khai được một **xương sống microservices chạy được** gồm:
- `OMS` (Order lifecycle + Saga orchestration + SignalR notification)
- `WMS` (inventory CRUD/query/reserve + event consumer)
- `Gateway` (YARP reverse proxy)
- `BuildingBlocks` (Result/Error/Entity + Integration Events contracts)

Đây là kiến trúc theo hướng DDD + Clean Architecture + Event-Driven, có:
- MediatR pipeline
- FluentValidation
- MassTransit + RabbitMQ
- EF Core + PostgreSQL
- Outbox/Inbox (MassTransit tables)
- JWT auth with Keycloak

Tuy nhiên, một số phần vẫn ở mức MVP hoặc chưa đồng bộ hoàn toàn (chi tiết mục rủi ro/khoảng trống).

---

## 2) Monorepo & Solution Layout

Top-level C# solution:
- `src/LMS.sln`

Core modules:
- `src/BuildingBlocks/BuildingBlocks.Domain`
- `src/BuildingBlocks/BuildingBlocks.Messaging`
- `src/Services/OMS/*`
- `src/Services/WMS/*`
- `src/Services/Gateway/Gateway.Api`

Clean layers trong OMS và WMS:
- `*.Domain`
- `*.Application`
- `*.Infrastructure`
- `*.Api`

---

## 3) OMS - What is really implemented

## 3.1 API Endpoints

Controllers đang có:
- `POST /api/orders` (create order)
- `GET /api/orders/{id}` (query order by id)
- `PUT /api/orders/{orderId}/actions/pickup`
- `PUT /api/orders/{orderId}/actions/receive`
- `PUT /api/orders/{orderId}/actions/sort`
- `PUT /api/orders/{orderId}/actions/dispatch`
- `PUT /api/orders/{orderId}/actions/deliver`
- `PUT /api/orders/{orderId}/actions/fail`

Nhận xét:
- Tất cả endpoint OMS yêu cầu `[Authorize]`.
- Khi tạo order, `ConsignorId` được ép từ claim người dùng (`NameIdentifier`) thay vì tin tưởng input.

## 3.2 Domain Model (`Order`)

Aggregate `Order` hiện chứa cả thông tin vận đơn/tracking theo trạng thái đời sống:
- Base: `ConsignorId`, `Consignee`, `WaybillCode`, `Status`, `CodAmount`, `ShippingFee`, `Weight`, `Note`
- Tracking: `PickupDriverId`, `WarehouseId`, `DestinationHubId`, `DeliveryDriverId`, `RouteId`, `ProofOfDeliveryUrl`, `FailureReason`, `DeliveryAttempts`

Domain methods đã code:
- `Create(...)`
- `Confirm()`
- `MarkPickedUp(...)`
- `MarkInWarehouse(...)`
- `MarkSorted(...)`
- `MarkDispatched(...)`
- `MarkDelivered(...)`
- `MarkFailed(...)`
- `Cancel()`

Status enum đầy đủ logistic flow:
`New -> Confirmed -> AwaitingPickup -> PickedUp -> AwaitingInbound -> InWarehouse -> Sorting -> AwaitingDispatch -> Dispatched -> Delivering -> Delivered -> Completed` + `Failed`, `Cancelled`, `ReturnInTransit`.

## 3.3 CQRS / Application Layer

Đã có command/query handlers:
- `CreateOrderCommandHandler`
- 6 action handlers cho pickup/receive/sort/dispatch/deliver/fail
- `GetOrderByIdQueryHandler`

Pipeline behaviors:
- LoggingBehavior
- ValidationBehavior

Validation có cho:
- `CreateOrderCommand`

## 3.4 Domain Events -> Integration Events Bridge

OMS phát domain events từ aggregate, sau đó bridge sang integration events trong event handlers:
- `OrderCreatedDomainEvent` -> `OrderCreatedIntegrationEvent`
- `OrderPickedUpDomainEvent` -> `ShipmentPickedUpIntegrationEvent`
- `OrderReceivedInWarehouseDomainEvent` -> `ShipmentReceivedIntegrationEvent`
- `OrderSortedDomainEvent` -> `ShipmentSortedIntegrationEvent`
- `OrderDispatchedDomainEvent` -> `RouteDispatchedIntegrationEvent`
- `OrderDeliveredDomainEvent` -> `DeliveryCompletedIntegrationEvent`
- `OrderDeliveryFailedDomainEvent` -> `DeliveryFailedIntegrationEvent`

Dispatch domain events thực hiện tại `ApplicationDbContext.SaveChangesAsync()` qua mediator extension.

## 3.5 Saga

Saga `OrderFulfillmentStateMachine` đã được triển khai với `OrderState` persistence:
- Correlation by `OrderId`
- States: `AwaitingPickup`, `PickedUp`, `InWarehouse`, `AwaitingDispatch`, `Dispatched`, `DeliveryFailed`, `Completed`, ...
- Hỗ trợ nhánh retry: `DeliveryFailed -> RouteDispatched -> Dispatched`

Saga repository dùng EF + PostgreSQL, `ConcurrencyMode.Pessimistic`.

## 3.6 SignalR Notifications

Đã có:
- `OrderHub` (`/hubs/order`) với `[Authorize]`
- `SignalRNotificationService`
- `OrderStatusChangedConsumer` consume nhiều integration events để push realtime cho `ConsignorId`

Luồng này cho phép cập nhật trạng thái realtime sau mỗi event nghiệp vụ.

## 3.7 OMS Persistence

`ApplicationDbContext` chứa:
- `Orders`
- `OrderStates`
- MassTransit tables: `InboxState`, `OutboxMessage`, `OutboxState`

Migrations cho thấy đã refactor từ model cũ sang flow logistics hiện tại (bỏ `OrderItems`, thêm tracking/cod/waybill...).

---

## 4) WMS - What is really implemented

## 4.1 API Endpoints

Controller `InventoryController` có:
- `POST /api/inventory` -> create inventory item
- `GET /api/inventory/{sku}` -> get inventory by sku
- `POST /api/inventory/reserve` -> reserve stock

Base controller có `[Authorize]` => endpoints yêu cầu token.

## 4.2 Domain Model (`InventoryItem`)

Fields:
- `Sku` (unique)
- `QuantityOnHand`
- `ReservedQty`
- `AvailableQty` (computed)
- `RowVersion` (`[Timestamp]`, mapped rowversion for optimistic concurrency)
- `LastRestockedAt`

Domain methods:
- `Create(...)`
- `ReserveStock(...)`
- `ReleaseStock(...)`
- `ConfirmStockDeduction(...)`
- `Restock(...)`

## 4.3 Application Layer

Implemented handlers:
- `CreateInventoryItemHandler`
- `ReserveStockHandler`
- `GetInventoryBySkuHandler`

Validation:
- `CreateInventoryItemValidator`
- `ReserveStockValidator`

Reserve flow có xử lý:
- not found
- insufficient stock (domain exception)
- `DbUpdateConcurrencyException`

## 4.4 Messaging in WMS

Consumer `OrderCreatedConsumer` đã đăng ký và hoạt động theo hướng hiện tại:
- Chỉ log `OrderCreatedIntegrationEvent`
- Không auto-reserve stock
- Comment ghi rõ inbound thực tế dự kiến do human scan trigger từ OMS side

=> WMS hiện là inventory service độc lập, chưa fully orchestrate auto reservation từ OMS.

## 4.5 WMS Persistence

`WMSDbContext` có:
- `InventoryItems`
- MassTransit tables: `InboxState`, `OutboxMessage`, `OutboxState`

Schema:
- unique index trên `Sku`
- row version concurrency cho inventory item

---

## 5) Integration Contracts (Shared Messaging)

`BuildingBlocks.Messaging/Events/OrderCreatedIntegrationEvent.cs` chứa toàn bộ event contracts chính:
- `OrderCreatedIntegrationEvent`
- `ShipmentPickedUpIntegrationEvent`
- `ShipmentReceivedIntegrationEvent`
- `ShipmentSortedIntegrationEvent`
- `RouteDispatchedIntegrationEvent`
- `DeliveryCompletedIntegrationEvent`
- `DeliveryFailedIntegrationEvent`

Tất cả kế thừa `IntegrationEvent(Id, OccurredOn)`.

---

## 6) Gateway (YARP)

Gateway đang route:
- `/api/oms/**` -> OMS
- `/api/wms/**` -> WMS
- Swagger aggregate qua:
  - `/swagger/oms/**`
  - `/swagger/wms/**`

Transforms dùng `PathRemovePrefix` + set `X-Forwarded-Prefix`.

CORS hiện `AllowAll` (dev-friendly, production cần siết lại).

---

## 7) Security & Auth

OMS/WMS đều cấu hình JWT bearer với Keycloak authority + valid issuers local/docker.

OMS có thêm logic map `realm_access.roles` -> `ClaimTypes.Role` để dễ authorize theo role .NET.

OMS cũng hỗ trợ token qua querystring cho SignalR hub (`/hubs/order`).

---

## 8) Infra & Runtime (docker-compose)

Stack local đầy đủ gồm:
- PostgreSQL (main DB)
- PostgreSQL riêng cho Keycloak
- RabbitMQ + management
- Redis
- Seq
- Jaeger
- Keycloak
- MailHog
- OMS API
- WMS API
- Gateway API

=> Môi trường local đủ để chạy E2E backend observability + auth + broker.

---

## 9) Data & Reliability Patterns Observed

Patterns đã áp dụng thật trong code:
- Domain events từ aggregate
- MediatR pipeline behaviors
- Integration events qua MassTransit
- Outbox/Inbox persistence cho reliability/idempotency
- Saga state machine persisted in DB
- Optimistic concurrency cho inventory row version

---

## 10) Gaps / Inconsistencies / Technical Risks

1. README khá cũ, chưa phản ánh đầy đủ flow mới (vẫn mô tả run tối giản).  
2. Documentation path trong README (`brain/architecture/`) không tồn tại trong branch hiện tại.  
3. WMS `OrderCreatedConsumer` chỉ log, chưa thực hiện reserve real flow; orchestration hiện thiên về OMS manual actions.  
4. Một số trạng thái trong enum chưa được trigger đầy đủ từ command endpoints (vd `Completed`, `Sorting`, `Delivering`, `ReturnInTransit`).  
5. Gateway chưa enforce auth centrally (đang mainly proxy + cors).  
6. Chưa thấy test project (unit/integration/contract tests) trong solution hiện tại.  
7. Package versions giữa projects không đồng đều (đặc biệt Serilog/Swashbuckle wildcard).  
8. WMS appsettings dùng `Audience = oms-client` (có thể intentional, nhưng cần confirm client model cho từng service).

---

## 11) Suggested Next Implementation Priorities

Priority 1 (stability):
- Bổ sung test suite tối thiểu: domain tests, handler tests, API integration tests.
- Chuẩn hóa package versions.
- Cập nhật README + runbook theo thực tế branch.

Priority 2 (business flow):
- Quyết định dứt điểm strategy reservation:
  - event-driven auto reserve ở WMS
  - hoặc human-in-the-loop hoàn toàn.
- Nếu event-driven: thêm consumer/command publish phản hồi reserve success/fail rõ ràng.

Priority 3 (production readiness):
- Harden CORS + auth policy gateway.
- Structured health checks cho dependency (db/rabbitmq/keycloak).
- Add retry/circuit-breaker policies cho outbound integrations.

Priority 4 (domain maturity):
- Hoàn thiện transitions cho `Delivering`, `Completed`, reverse logistics.
- Tách rõ command surface cho B2B/B2C nếu nghiệp vụ diverge.

---

## 12) Final Assessment

Codebase hiện tại đã vượt mức skeleton và đã có:
- nghiệp vụ OMS khá sâu,
- event + saga + notification realtime,
- WMS inventory API usable,
- infra local mạnh.

Đây là nền tảng tốt để đi tiếp sang production-grade, nhưng cần tập trung vào **testability**, **flow consistency OMS↔WMS**, và **documentation synchronization** để giảm rủi ro khi team mở rộng.
