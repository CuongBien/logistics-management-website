# BÁO CÁO DỰ ÁN LOGISTICS MANAGEMENT SYSTEM (LMS)

**Ngày báo cáo:** 06/03/2025  
**Phiên bản:** 1.0

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1 Giới thiệu

**Logistics Management System (LMS)** là hệ thống quản lý logistics được xây dựng theo kiến trúc microservices, sử dụng .NET 8, tuân thủ nguyên tắc **Clean Architecture** và **Domain-Driven Design (DDD)**.

### 1.2 Mục tiêu

- Quản lý đơn hàng (Order Management)
- Quản lý kho hàng và tồn kho (Warehouse Management)
- Tích hợp liên dịch vụ qua message broker
- Cung cấp API thống nhất qua API Gateway
- Xác thực và phân quyền tập trung qua Keycloak

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Cấu trúc giải pháp

```
LMS Solution
├── BuildingBlocks/           # Thư viện dùng chung
│   ├── BuildingBlocks.Domain      # Base entities, Result, IDomainEvent
│   └── BuildingBlocks.Messaging   # Integration events, MassTransit
├── Services/
│   ├── OMS/                  # Order Management Service
│   │   ├── OMS.Domain
│   │   ├── OMS.Application
│   │   ├── OMS.Infrastructure
│   │   └── OMS.Api
│   ├── WMS/                  # Warehouse Management Service
│   │   ├── WMS.Domain
│   │   ├── WMS.Application
│   │   ├── WMS.Infrastructure
│   │   └── WMS.Api
│   └── Gateway/             # API Gateway (YARP)
│       └── Gateway.Api
```

### 2.2 Công nghệ sử dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Runtime | .NET 8 |
| Database | PostgreSQL (PostGIS cho OMS, PostgreSQL cho WMS) |
| Message Broker | RabbitMQ |
| Caching | Redis |
| Authentication | Keycloak (OAuth2/OIDC, JWT) |
| API Gateway | YARP (Yet Another Reverse Proxy) |
| Messaging | MassTransit |
| Logging | Serilog + Seq |
| Tracing | Jaeger |
| Email Testing | MailHog |

---

## 3. CÁC DỊCH VỤ CHÍNH

### 3.1 Order Management Service (OMS)

**Chức năng:**
- Tạo đơn hàng với thông tin khách hàng, địa chỉ giao hàng và danh sách sản phẩm
- Xác nhận đơn hàng (Confirm)
- Hủy đơn hàng (Cancel)
- Tra cứu đơn hàng theo ID

**API Endpoints:**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/orders` | Tạo đơn hàng mới |
| GET | `/api/orders/{id}` | Lấy chi tiết đơn hàng |

**Trạng thái đơn hàng (OrderStatus):**
- New → Confirmed → Allocated → PickPack → Handover → Delivering → Completed
- Cancelled (khi hủy)

**Domain Events:**
- `OrderCreatedDomainEvent`: Phát khi tạo đơn hàng thành công
- `OrderCancelledDomainEvent`: Phát khi hủy đơn hàng

**Value Objects:**
- `Address`: Địa chỉ giao hàng
- `Money`: Giá tiền với đơn vị tiền tệ

### 3.2 Warehouse Management Service (WMS)

**Chức năng:**
- Quản lý tồn kho theo SKU
- Tạo mục tồn kho
- Đặt chỗ (reserve) hàng cho đơn hàng
- Tra cứu tồn kho theo SKU

**API Endpoints:**
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/inventory` | Tạo mục tồn kho |
| GET | `/api/inventory/{sku}` | Lấy thông tin tồn kho theo SKU |
| POST | `/api/inventory/reserve` | Đặt chỗ hàng |

### 3.3 API Gateway

- Sử dụng YARP để reverse proxy tới OMS và WMS
- Swagger UI tích hợp: `/swagger/oms/v1/swagger.json`, `/swagger/wms/v1/swagger.json`
- CORS: AllowAll (phát triển)
- Health check: `/health`

---

## 4. LUỒNG NGHIỆP VỤ CHÍNH

### 4.1 Luồng tạo đơn hàng và đặt chỗ kho

```
1. Client → POST /api/orders (OMS)
2. OMS: Tạo Order (Domain) → OrderCreatedDomainEvent
3. OrderCreatedEventHandler: Chuyển sang OrderCreatedIntegrationEvent → RabbitMQ
4. WMS OrderCreatedConsumer: Nhận event → Reserve stock
   - Thành công: Publish InventoryReservedIntegrationEvent
   - Thất bại: Publish InventoryReservationFailedIntegrationEvent
5. Saga (OrderFulfillmentStateMachine): Theo dõi trạng thái
   - OrderCreated → InventoryReserving
   - InventoryReserved → InventoryReserved → Completed
   - InventoryReservationFailed → Faulted
6. OrderStatusChangedConsumer: Gửi thông báo real-time qua SignalR
```

### 4.2 Saga – Order Fulfillment

**OrderFulfillmentStateMachine** quản lý vòng đời đơn hàng:

| Trạng thái | Mô tả |
|------------|-------|
| Initially | Chờ OrderCreated |
| InventoryReserving | Đang đặt chỗ kho |
| InventoryReserved | Đã đặt chỗ thành công |
| Completed | Hoàn tất (Sprint 5: chưa có bước TMS) |
| Faulted | Lỗi đặt chỗ kho |

**OrderState** lưu: OrderId, CustomerId, TotalAmount, InventoryReservedFlag, CurrentState.

---

## 5. CƠ SỞ HẠ TẦNG

### 5.1 Docker Compose (docker-compose.local.yml)

| Service | Port | Mô tả |
|---------|------|-------|
| postgres | 56432 | Database chính (PostGIS) |
| postgres-keycloak | 5434 | Database Keycloak |
| rabbitmq | 5672, 15672 | Message broker + Management UI |
| redis | 6379 | Cache |
| seq | 5341, 8081 | Log aggregation |
| jaeger | 16686, 4317, 4318 | Distributed tracing |
| keycloak | 8080 | Identity & Access Management |
| mailhog | 1025, 8025 | SMTP testing |
| oms.api | 5000 | OMS API |
| wms.api | 5051 | WMS API |
| gateway.api | 8000 | API Gateway |

### 5.2 Outbox Pattern

- Sử dụng MassTransit Entity Framework Outbox với PostgreSQL
- Đảm bảo gửi message và cập nhật DB trong cùng transaction
- QueryDelay: 1 giây

---

## 6. BẢO MẬT

- **JWT Bearer** qua Keycloak realm `logistics_realm`
- Audience: `oms-client`
- Map `realm_access.roles` sang `ClaimTypes.Role`
- SignalR: Hỗ trợ token qua query string `access_token` cho `/hubs/order`

---

## 7. THÔNG BÁO REAL-TIME (SignalR)

- **OrderHub** tại `/hubs/order`
- Yêu cầu xác thực (`[Authorize]`)
- `OrderStatusChangedConsumer` gửi thông báo khi:
  - Inventory Reserved: "Your items have been successfully reserved..."
  - Inventory Reservation Failed: "Failed to reserve items: {reason}"
- `INotificationService` → `SignalRNotificationService` gửi tới user theo `CustomerId`

---

## 8. TRẠNG THÁI PHÁT TRIỂN (Git Status)

**Đã triển khai:**
- OMS: Create Order, Get Order, Confirm, Cancel
- WMS: Inventory CRUD, Reserve Stock
- Saga Order Fulfillment (Inventory reservation flow)
- SignalR notifications
- Keycloak authentication
- API Gateway với YARP
- Docker Compose đầy đủ

**Đang thay đổi / mới:**
- Migrations mới cho OrderState (Saga)
- Xóa InventoryReservationFailedConsumer, InventoryReservedConsumer cũ (đã thay bằng OrderStatusChangedConsumer)
- Thêm OrderHub, SignalRNotificationService
- Thêm INotificationService, Features/Notifications

---

## 9. HƯỚNG DẪN CHẠY DỰ ÁN

### 9.1 Yêu cầu

- .NET 8 SDK
- Docker Desktop

### 9.2 Chạy infrastructure

```bash
docker-compose -f docker-compose.local.yml up -d
```

### 9.3 Chạy từng service

```bash
# OMS
cd src/Services/OMS/OMS.Api
dotnet run

# WMS
cd src/Services/WMS/WMS.Api
dotnet run

# Gateway
cd src/Services/Gateway/Gateway.Api
dotnet run
```

### 9.4 Truy cập

- Swagger OMS: http://localhost:5000/swagger
- Swagger WMS: http://localhost:5051/swagger
- Gateway: http://localhost:8000
- Keycloak: http://localhost:8080
- RabbitMQ Management: http://localhost:15672
- Seq: http://localhost:8081

---

## 10. KẾT LUẬN

Dự án LMS đã triển khai nền tảng microservices với:

- **2 dịch vụ nghiệp vụ**: OMS và WMS
- **Message-driven**: RabbitMQ + MassTransit
- **Saga** cho luồng đặt chỗ kho
- **Real-time notifications** qua SignalR
- **Bảo mật** với Keycloak
- **Infrastructure** đầy đủ qua Docker Compose

Hệ thống phù hợp để mở rộng thêm các bước như TMS (Transport Management), PickPack, Handover, Delivering trong các sprint tiếp theo.
