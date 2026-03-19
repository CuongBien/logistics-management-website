# Triển khai & Hạ tầng (Infrastructure & Tools)

Phần này tóm tắt các công cụ và nền tảng hạ tầng (Infrastructure) được sử dụng để hỗ trợ hệ thống Logistics (LMS) hoạt động trơn tru trong kiến trúc Microservices.

---

## 1. Docker & Docker Compose

Thay vì cài đặt thủ công từng công cụ (Postgres, RabbitMQ, Redis, Keycloak) lên máy tính cục bộ, chúng ta sử dụng **Docker** để đóng gói toàn bộ môi trường chung vào một cấu hình thống nhất (`docker-compose.yml`).

- **Tính nhất quán:** Code chạy được trên máy Dev A thì chắc chắn cũng chạy được trên máy Dev B hoặc Test.
- **Tiện lợi:** Chỉ cần chạy lệnh `docker-compose up -d`, dev có thể test ngay mà không tốn hàng giờ Cấu hình Database hay RabbitMQ.
- Tương lai (Phase 3 Roadmap): Hệ thống sẽ chuyển từ Docker-Compose (Local/Dev) lên **Kubernetes** để dễ dàng Auto-Scaling khi lượng tải tăng vọt.

---

## 2. Keycloak (Authentication & Security)

Hệ thống ủy quyền (Auth) được tách riêng biệt (Auth Service) thay vì tự code bằng JWT cơ bản. **Keycloak** là một giải pháp mã nguồn mở quản lý danh tính theo chuẩn OpenID Connect (OIDC).

- **Kiểm soát truy cập (Role-based):** Người dùng (Tài xế, Quản kho, Admin) được gán các vai trò Role riêng biệt.
- **Token-based:** Các Microservices không giữ password user, chúng chỉ cần xác nhận JWT Token được nhúng trong request Header (`Authorization: Bearer <token>`).

---

## 3. YARP (API Gateway)

Đứng chặn ở cửa ngõ hệ thống (ví dụ: cổng 5000) là API Gateway phân giải request cho Client (App/Web). Dự án dùng **YARP (Yet Another Reverse Proxy)** phát triển bởi Microsoft - linh hoạt và tối ưu hóa hiệu năng cực tốt cho C#.

**Nhiệm vụ của YARP:**
- Chuyển tiếp Request: Mọi thao tác kho (`/api/wms`) $\rightarrow$ Backend WMS; Mọi thao tác đơn hàng (`/api/oms`) $\rightarrow$ Backend OMS.
- Xác thực ban đầu: YARP Offload Validation, có khả năng từ chối luôn những request không có Token hợp lệ trước cả khi chạy tới Backend.

---

## 4. PostgreSQL & Redis

### PostgreSQL
- Nhờ EF Core hỗ trợ, chúng ta dùng CSDL quan hệ **PostgreSQL**. Mỗi Microservice sẽ có **Database riêng biệt** hoặc **Schema riêng lẻ** trên cùng Master Instance (Ví dụ `lms_oms_dev`, `lms_wms_dev`).
- **Concurrency (Tranh thủ Cập nhật):** PostgreSQL hỗ trợ tốt thuộc tính `[Timestamp]` để chặn Race-condition thông qua Optimistic Concurrency Control (OCC) trong Entity Framework khi check out Tồn kho (tránh âm kho).

### Redis (In-Memory Database)
- Đóng vai trò làm bộ đệm cực nhanh (Caching).
- Khả năng **Rate Limiting (chặn Spam):** YARP kết nối với Redis để theo dõi xem một tài khoản có call API liên tục hay không, tự động khóa nếu chạm mức giới hạn mỗi phút $\rightarrow$ Chống phần mềm spam API.

---
*Tóm tắt: Docker gói mọi phần mềm; Keycloak lo bảo mật; YARP đứng gác cổng chia traffic; PostgreSQL lưu lâu dài còn Redis hỗ trợ tốc độ tức thì.*
