# Current Sprint: Project Initialization & Foundation

**Goal:** Khởi tạo Source Code, thiết lập kiến trúc chuẩn và chạy được "Hello World" của hệ thống Microservices.

## High Priority (Must Do)

- [x] **Project Setup:** Tạo Solution .NET, cấu trúc thư mục Clean Architecture cho OMS Service.
- [x] **Shared Kernel:** Tạo thư viện Shared chứa các Base Entity, Interfaces, Result Pattern.
- [x] **Infrastructure as Code:** Tạo file `docker-compose.yml` chạy đủ bộ: Postgres, RabbitMQ, Redis, Keycloak, Observability.
- [x] **Repo Initialization:** Commit code lên Git.
- [ ] **Documentation:** Hoàn thiện hướng dẫn Onboarding (`brain/architecture/`).

## Medium Priority (Should Do)

- [x] **Gateway Prototype:** Cấu hình YARP đơn giản để forward request tới OMS (Port 5200).
- [x] **Auth Prototype:** Bảo vệ 1 API endpoint bằng Keycloak Token (Updated Validation Logic).

## Done Criteria

- [x] Build Solution thành công không lỗi.
- [x] Chạy được `docker-compose up` lên toàn bộ hạ tầng.
- [x] Gọi được 1 API qua Gateway có check Auth.
