# Done Log (Những việc đã hoàn thành)

Ghi lại lịch sử các đầu việc lớn đã hoàn tất để tránh làm lại hoặc quên context.

## Foundation & Setup (Sprint 1)

- [x] **Project Structure:** Tạo Solution .NET 8, cấu trúc Clean Architecture cho OMS Service.
- [x] **Shared Kernel:** Implement `Entity`, `ValueObject`, `Result`, `IRepository`, `IUnitOfWork`.
- [x] **Infrastructure:** Docker Compose (Postgres, RabbitMQ, Redis, Keycloak, Seq, Jaeger, MailHog).
- [x] **Git Init:** Khởi tạo repository và initial commit.
- [x] **Gateway Prototype:** YARP Reverse Proxy (Port 5200), routing `/oms` prefix.
- [x] **Auth Prototype:** Integrated Keycloak, JWT Validation (Audience/Issuer), `[Authorize]` attribute.

## Documentation & Architecture

- [x] **Architecture Report Conversion:** Chuyển đổi báo cáo PDF sang Markdown (`brain/architecture/`).
- [x] **Domain Modeling:** Phân tách các module OMS, WMS, TMS (`brain/domain/`).
- [x] **New Folders:** Tạo cấu trúc `brain/plans` và `brain/skills`.
- [x] **Tech Rule Update:** Cập nhật Frontend Stack và Reliability Patterns.
