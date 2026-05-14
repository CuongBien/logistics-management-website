# Sprint 3: Warehouse Service & Inventory Integration

**Goal:** Xây dựng dịch vụ kho (Warehouse Service) để quản lý tồn kho và tích hợp quy trình xử lý đơn hàng tự động (Event-Driven) đảm bảo tính nhất quán (Consistency).

## High Priority (Must Do)

### 1. New Service: Warehouse (`src/Services/Warehouse`)

- [x] **Scaffolding:** Tạo project structure mới (Domain, Application, Infrastructure, Api) theo Clean Architecture Template.
- [x] **Domain Model (Inventory):**
  - Entity `InventoryItem` (Id, Sku, Quantity, _RowVersion_).
  - Logic `ReserveStock(qty)`: Throw domain exception nếu thiếu hàng.
  - **Concurrency:** Sử dụng `[Timestamp]` (EF Core - đã fix `uint` cho Postgres) để chặn race condition.
- [x] **Infrastructure:**
  - Setup EF Core w/ Postgres (`lms_wms_dev`).
  - Configure MassTransit (RabbitMQ) + **Outbox Pattern**.
- [x] **Seed Data:** Tạo API `POST /api/inventory` để nạp dữ liệu.

### 2. Integration (Event-Driven Consumer)

- [x] **OrderCreatedConsumer:**
  - Warehouse Service lắng nghe `OrderCreatedIntegrationEvent`.
  - **Idempotency:** Implement check `MessageId` (hoặc dùng thư viện MassTransit Inbox) để tránh trừ kho 2 lần.
  - Logic:
    - Success: Trừ tồn kho -> Publish `InventoryReservedEvent`.
    - Fail (Hết hàng/Lỗi): Publish `InventoryReservationFailedEvent`.

### 3. OMS Updates (Saga Choreography)

- [x] **InventoryReservedConsumer (tại OMS):**
  - Nhận event -> Update Order Status sang `Confirmed`.
- [x] **InventoryReservationFailedConsumer (tại OMS):**
  - Nhận event -> Update Order Status sang `Cancelled` -> Ghi log lý do hủy.

## Technical Tasks

- [ ] **Docker Compose:** Add `warehouse.api`, `warehouse-db`.
- [ ] **API Gateway (YARP):** Route `/api/warehouse/*` -> `Warehouse.Api`.

## Done Criteria

1. Service `Warehouse` chạy độc lập, có dữ liệu test.
2. API tạo đơn (OMS) kích hoạt logic trừ kho bên Warehouse.
3. Test case "Tranh chấp": Gửi 2 request mua hàng cùng lúc cho 1 sản phẩm còn quantity = 1 -> Chỉ 1 đơn thành công, 1 đơn bị hủy.
4. Test case "Mất mạng": Tắt Warehouse Service, tạo đơn ở OMS. Bật lại Warehouse -> Tồn kho vẫn phải bị trừ (cơ chế Retry của RabbitMQ).
