# 🚚 Enterprise Logistics Management System (LMS)

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](https://dotnet.microsoft.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-EventBus-FF6600?logo=rabbitmq)](https://www.rabbitmq.com/)

**LMS** là một hệ thống Vận hành Kho bãi và Vận tải chuyên nghiệp cấp độ Doanh nghiệp (Enterprise). Hệ thống được xây dựng trên nền tảng **Event-Driven Microservices**, tuân thủ nghiêm ngặt mô hình **Domain-Driven Design (DDD)** và **Clean Architecture**.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

LMS chia nhỏ bài toán vận hành thành các Bounded Contexts định danh chuẩn xác (Ubiquitous Language):

- 🛡️ **Web.Bff.Logistics (API Gateway)**: Cổng giao tiếp duy nhất dựa trên YARP, chịu trách nhiệm Reverse Proxy và Offloading Authentication.
- 📦 **Ordering Service**: Trái tim điều phối vòng đời Đơn Hàng. Sử dụng `Saga Orchestration (MassTransit State Machine)` để quản lý quy trình đa dịch vụ.
- 🏭 **Warehouse Service**: Hệ thống Quản trị Tồn kho và Vị trí Kệ/Khía. Sử dụng `Optimistic Concurrency Control (Version/Xmin)` để chặn Race Condition.
- 🧱 **Building Blocks**: Thư viện dùng chung (Shared Kernel) chứa các nền tảng lõi như `Result Pattern`, `Domain Events`, và cấu hình `RabbitMQ EventBus`.

> 📖 **Xem sơ đồ chi tiết:** Hệ thống tài liệu kỹ thuật chuyên sâu được lưu trữ tại thư mục `docs/`. Mở xem [Sơ đồ Kiến trúc Tổng thể (System Architecture)](docs/system_architecture.md) và [Quy hoạch Database](docs/db_architecture.md).

---

## 🛠️ Trạm Kỹ Thuật (Tech Stack)

Công nghệ tinh hoa hội tụ trong dự án này:
- **Ngôn ngữ & Framework:** `C# 12`, `.NET 8`, `ASP.NET Core Web API`
- **Giao tiếp (Messaging):** `RabbitMQ` tích hợp qua `MassTransit` (Hỗ trợ Outbox & Inbox Pattern).
- **Cơ sở dữ liệu:** `PostgreSQL 16` điều khiển qua `Entity Framework Core`.
- **Đồng bộ hóa (Real-time):** `SignalR WebSockets` đẩy thông báo ngay lập tức xuống Mobile/Web App.
- **Bảo mật (Security):** Ủy quyền qua máy chủ OIDC **RedHat Keycloak** (JWT Bearer Token).
- **Giám sát (Observability):** `OpenTelemetry` xuất Distributed Tracing log sang `Jaeger UI`.
- **Hạ tầng (Deployment):** Sẵn sàng lên Production với `Docker Compose`.

---

## 🚀 Hướng Dẫn Chạy Dự Án (How to Run)

### Yêu Cầu Cài Đặt (Prerequisites)
1. [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Bước 1: Khởi động Hạ tầng Docker (Infrastructure)
Hệ thống yêu cầu các thành phần lõi (Postgres, RabbitMQ, Keycloak, Redis) phải chay ngầm trước cống hiến Data. Mở Terminal tại gốc dự án và gõ:

```bash
cd deploy/docker
docker-compose -f docker-compose.local.yml up -d
```
*Các dịch vụ sẽ mất khoảng 10-15 giây để khởi tạo hoàn chỉnh. Truy cập `http://localhost:16686` để xem Jaeger hoặc `http://localhost:8080` để vào Keycloak Admin.*

### Bước 2: Chạy Các Microservices (Backend)
Bạn có thể mở solution `Logistics.sln` bằng Visual Studio / Rider và thiết lập tính năng **Multiple Startup Projects** để chạy cùng lúc 3 projects:
1. `Web.Bff.Logistics.Api` (Cổng 5200)
2. `Ordering.Api` (Cổng 5000)
3. `Warehouse.Api` (Cổng 5001)

Hoặc dùng CLI để chạy thủ công từng service:
```bash
# Terminal 1: Chạy Ordering Service
cd src/Services/Ordering/Ordering.Api
dotnet run

# Terminal 2: Chạy Warehouse Service
cd src/Services/Warehouse/Warehouse.Api
dotnet run

# Terminal 3: Chạy API Gateway
cd src/ApiGateways/Web.Bff.Logistics/Web.Bff.Logistics.Api
dotnet run
```

### Bước 3: Trải nghiệm Swagger
Mở trình duyệt truy cập thẳng qua cổng Gateway:
- **Ordering API (qua Gateway):** `http://localhost:5200/api/ordering/swagger`
- **Warehouse API (qua Gateway):** `http://localhost:5200/api/warehouse/swagger`

---

## 📚 Thư Viện Đào Tạo Nội Bộ (Training Material)

Dự án này sở hữu bộ tài liệu khóa học nội bộ chuẩn chỉ nhất dành cho nhân sự Team tham gia. Bộ tài liệu `Markdown` chia làm 14 chương đi từ số 0 đến Trùm cuối được lưu tại `docs/checklist/`:
1. [01_clean_architecture.md](docs/checklist/01_clean_architecture.md)
2. [02_ddd_aggregates.md](docs/checklist/02_ddd_aggregates.md)
...
14. [14_signalr_websockets.md](docs/checklist/14_signalr_websockets.md)

---
*Dự án tâm huyết dành cho kỷ nguyên vận hành hàng hóa 4.0!*
