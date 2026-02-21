# Security & API Gateway Strategy

## 1. Security Framework (AuthN & AuthZ)

Bảo mật là ưu tiên hàng đầu, áp dụng mô hình **Zero Trust**.

### 1.1. Authentication (Xác thực)

- **Protocol:** OpenID Connect (OIDC) & OAuth 2.0.
- **Identity Provider (IdP):**
  - Sử dụng **Keycloak** (Self-hosted) hoặc **IdentityServer Duende** (nếu cần tùy biến sâu trong .NET).
  - Tập trung quản lý Identity: Tất cả user (Admin, Driver, Customer, Partner) đều đăng nhập qua IdP này.
- **Token Management:** Sử dụng JWT (JSON Web Tokens). Access Token có thời hạn ngắn (ví dụ: 15-30 phút), kết hợp Refresh Token giảm thiểu rủi ro.

### 1.2. Authorization (Phân quyền)

- **RBAC (Role-Based Access Control):** Phân quyền dựa trên Vai trò (e.g., `Admin`, `WarehouseManager`, `Driver`).
- **ABAC (Attribute-Based Access Control):** Cần thiết cho các logic phức tạp (ví dụ: `Driver` chỉ xem được đơn hàng được gán cho chính mình, hoặc đơn thuộc `Region` của họ).
- **Implementation in .NET:** Sử dụng **Policy-based Authorization** trong ASP.NET Core.

## 2. API Gateway Layer

Gateway đóng vai trò là "cổng thành", che giấu các microservices bên trong.

- **Technology:** **YARP (Yet Another Reverse Proxy)**. Đây là thư viện Reverse Proxy hiệu năng cao do Microsoft phát triển, hoàn toàn bằng .NET.
- **Pattern:** **BFF (Backend for Frontend)** pattern. Có thể tách riêng Gateway cho Mobile App và Web Portal nếu logic khác biệt quá lớn.
- **Responsibilities:**
  - **Routing:** Điều hướng request tới đúng Service (OMS, WMS, TMS).
  - **Auth Offloading:** Gateway xác thực Token trước khi cho vào trong. Các Services bên trong tin tưởng header `X-User-Id` do Gateway forward (hoặc validate lại token tùy mức độ bảo mật).
  - **Rate Limiting:** Chống DDoS và spam request.
  - **SSL Termination:** Xử lý mã hóa tại Gateway để giảm tải cho các services con.
