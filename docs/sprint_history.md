# 🚀 Lịch Sử Phát Triển Theo Sprint (Sprint History)

Tài liệu này tổng hợp cụ thể những tính năng và kiến trúc đội ngũ đã **HOÀN THÀNH** đi lên từ con số 0 qua các Sprint, bám sát Roadmap ban đầu.

---

## ✔️ Sprint 1: Foundation & Setup
**Mục tiêu:** Xây móng hạ tầng, rải nền móng bảo mật và chuẩn bị Source code rỗng.
- **DevOps/Infra:** Viết trọn vẹn file `docker-compose.yml` nhấc bổng PostgreSQL 16, RabbitMQ, Redis, Keycloak, Seq (Logs), Jaeger (Tracing).
- **Kiến trúc Code:** Khởi tạo Solution `.NET 8`, chia project theo Clean Architecture cho Service đầu lòng (`OMS`).
- **Core (Shared Kernel):** Code ra các class cốt tủy của nền tảng: `AggregateRoot`, `ValueObject`, `Result Pattern`, Interface `IUnitOfWork` và `IRepository`.
- **Cổng Giao Tiếp:** Set up YARP API Gateway chạy Port 5200 với luật định tuyến `/oms/api` chuẩn chỉ. Gắn cài Authentication OIDC trỏ về Keycloak.

---

## ✔️ Sprint 2 & 3: OMS Core & CQRS
**Mục tiêu:** Chức năng Đặt Hàng đầu tiên, thiết lập vòng đời chuẩn MediatR.
- **Lập trình API:** Hoàn thành các Endpoint Tạo đơn hàng (Create Order) dội qua `API Controller`.
- **Luồng CQRS:** Xây dựng Command/Query độc lập nhau. Apply FluentValidation chặn lỗi payload nhập bậy bạ ngay trước khi lọt vào Application.
- **Tránh Quăng Lỗi (No Exception):** Áp dụng triệt để `Result.Failure` kết hợp `ProblemDetails` (RFC 7807) ra Frontend với chuẩn HTTP 400.

---

## ✔️ Sprint 4: RabbitMQ & Transactional Outbox
**Mục tiêu:** Mở đường kết nối chéo giữa các dịch vụ.
- **Event Bus:** Đưa MassTransit vào hệ thống. Wrap RabbitMQ để code ẩn danh đi việc Connect/Retry.
- **Outbox Pattern:** Cấp phép cho EF Core (`DbContext`) nhận 3 bảng Phụ trợ `OutboxState, OutboxMessage, InboxState`. Đảm bảo Order được lưu đồng thời 100% cùng lúc với Event nhét vô RabbitMQ.
- **Idempotency:** Xử lý chặn tin nhắn trùng (Consumer Inbox Pattern) giúp WMS không nhận dư tồn kho khi rớt mạng gửi lại (Retry).

---

## ✔️ Sprint 5: Saga Orchestration & Tốc Độ Realtime
**Mục tiêu:** Quản trị vòng đời lệnh đi liên tiểu bang. Đẩy thông báo Live xuống màn hình điện thoại.
- **Saga State Machine:** Chuyển đổi từ mô hình nhảy múa lung tung không ai quản lý (Choreography) sang Nhạc Trưởng (Orchestration).
  - Khởi tạo File máy state trọn vẹn theo dõi 3 phase: *Submitted -> InventoryReserved -> Completed / Faulted.*
  - Kết nối `CorrelationId` với bảng DB `OrderState`.
- **Real-time WebSockets:** Tích hợp SignalR trực tiếp. Bắn Pop-up ngay trên trình duyệt UI với lệnh `Clients.User(...).SendAsync`.
- **Theo Dõi Vết (Distributed Tracing):** Nối OpenTelemetry bám chùm nhúng qua HttpClient -> Entity Framework -> MassTransit -> Phóng lên Jaeger UI 16686.

---

## ⏳ Sprints Tiếp Theo (Từ Sprint 6 & 7)
**Trọng tâm:** Xây dựng Hệ sinh thái Dịch vụ Kho bãi (Warehouse Management System).
- Tách API Quản trị kho (`/route`, `/receive`, `/sort`) ra khỏi Đơn Bán (`OMS`).
- Phân luồng Cấu trúc vật lý: Warehouse $\rightarrow$ Block $\rightarrow$ Zone $\rightarrow$ Bin.
- Khóa bi quan và Lạc Quan (Optimistic `IsRowVersion` trong Postgres) chống **Race Condition**.
