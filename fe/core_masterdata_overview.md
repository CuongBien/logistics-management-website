# Tổng quan Triển khai Frontend cho Core & MasterData (Dữ liệu nền tảng & Hệ thống)

Tài liệu này phác thảo kế hoạch phát triển các tính năng dùng chung (Core), Dữ liệu danh mục cốt lõi (MasterData) mang dáng dấp của một hệ thống ERP/CRM thu nhỏ, và các tính năng sống còn như Đăng nhập, Đăng ký (Authentication) cùng với Phân hệ đa khách hàng (Multi-tenancy).

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Xác thực & Đăng ký (Authentication & Registration - SaaS Model)
- **Mục đích:** Bảo vệ hệ thống, quản lý luồng đăng nhập của người dùng nội bộ, và mở luồng đăng ký tự phục vụ (Self-service Registration) cho khách hàng B2B.
- **Tính năng:**
  - **Trang Đăng ký (Sign Up):** Giao diện onboarding dành cho Chủ hàng/Khách hàng mới. Nhập Email, Mật khẩu, Tên Doanh nghiệp, Số điện thoại. Sau khi gửi, hệ thống khởi tạo `Tenant` mới trên MasterData và cấp quyền Owner.
  - **Trang Đăng nhập (Login):** Giao diện nhập Username/Password cho cả Admin, Nhân viên kho và Chủ hàng.
  - **AuthProvider (React Context):** Component bao bọc toàn bộ App, chịu trách nhiệm lưu trữ JWT token, tự động đính kèm `Authorization: Bearer` vào các request API gọi xuống Backend.
  - Xử lý các nghiệp vụ phụ trợ: Đăng xuất (Logout), Session Timeout (Hết hạn Token), Quên mật khẩu (nếu cần).

### 1.2. Quản lý Đa khách thuê (Multi-Tenancy Context)
- **Mục đích:** Hệ thống logistics phục vụ song song hàng trăm chủ hàng (Tenants/Consignors) với dữ liệu độc lập. Giao diện (FE) cần cung cấp cơ chế linh hoạt để thao tác trên các ngữ cảnh này.
- **Tính năng:**
  - **Dành cho Admin hệ thống:** Hiển thị thẻ `<TenantSelector>` (Dropdown chọn Khách hàng) tại Top Header. Khi chuyển từ "Khách hàng A" sang "Khách hàng B", toàn bộ Dashboard OMS, Đơn hàng, Hàng tồn kho bên dưới sẽ tự động thay đổi dữ liệu theo Khách hàng được chọn.
  - **Dành cho Chủ hàng (Consignor):** Hệ thống ẩn `<TenantSelector>`, tự động khóa (Lock) dữ liệu của họ dựa trên Token đang sở hữu.

### 1.3. Quản lý Đối tác & Khách hàng (Partner Management / Mini ERP)
- **Mục đích:** Quản lý danh bạ khách hàng (Customer), chủ hàng (Consignor), nhà cung cấp (Supplier) và đơn vị vận tải (Carrier).
- **Tính năng:**
  - **Bảng dữ liệu (Partners DataTable):** Liệt kê đối tác kèm theo Tên, Số điện thoại, Loại hình, Tọa độ GPS, Trạng thái (Active/Inactive).
  - **Tạo mới & Cập nhật (Partner Form Dialog):** Giao diện Modal dùng chung cho thao tác Thêm/Sửa đối tác.
  - **Xóa mềm (Deactivate):** Nút ngưng hoạt động đối tác không còn hợp tác.

### 1.4. Thiết lập Hệ thống (System Settings)
- **Mục đích:** Cấu hình các thông số toàn cục cho giao diện WMS/OMS.
- **Tính năng:**
  - Nút chuyển đổi giao diện Sáng/Tối (Dark Mode / Light Mode) qua `next-themes`.
  - Cấu hình hiển thị sidebar (Thu gọn/Mở rộng).

---

## 2. Danh Sách API Backend Tích Hợp

Service: `MasterData.Api` (Controller: `PartnersController`) và cơ chế lấy JWT.

| Phân nhóm | Method | Endpoint | Payload / Mô tả |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | *(TBD: Identity Service / Auth0)*| Nhận thông tin Sign Up và trả về User Profile + TenantId. |
| | `POST` | `/api/devaccount/token` | (Môi trường Dev) Sinh nhanh JWT Token để test. |
| **Partners**| `GET` | `/api/partners` | `?searchTerm=...&page=1` Lấy danh sách đối tác |
| | `GET` | `/api/partners/{id}` | Lấy chi tiết đối tác theo ID |
| | `POST` | `/api/partners` | `{ name, phone, address, city, lat, lng }` Tạo đối tác mới. |
| | `PUT` | `/api/partners/{id}` | Cập nhật thông tin đối tác |
| | `DELETE` | `/api/partners/{id}` | Hủy kích hoạt (Deactivate) đối tác |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/core.ts` và `types/masterdata.ts`:

```typescript
// --- Core & Auth ---
export interface UserSession {
  token: string;
  sub: string;       // UserId (Ví dụ: auth0|123)
  tenantId: string;  // Nullable nếu là Admin tổng
  roles: string[];
}

export interface SignUpRequest {
  companyName: string;
  email: string;
  passwordHash: string; // Tùy thuộc vào Authentication provider
  phone?: string;
}

// --- MasterData ---
export interface PartnerDto {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerFormValues {
  name: string;
  phone: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(auth)/login/page.tsx`: Giao diện Đăng nhập.
- `app/(auth)/signup/page.tsx`: Giao diện Đăng ký mở tài khoản.
- `app/(dashboard)/masterdata/partners/page.tsx`: Giao diện Quản lý danh sách Đối tác (CRM).
- `app/(dashboard)/settings/page.tsx`: Tùy chỉnh hệ thống.

### Components (`components/core/` và `components/masterdata/`)
- **Core Components:**
  - `AppSidebar.tsx`: Chứa menu điều hướng, có phân nhánh phân hệ WMS, OMS và CRM (MasterData).
  - `Header.tsx`: Thanh điều hướng phía trên chứa `<TenantSelector>` và Avatar.
  - `TenantSelector.tsx`: Dropdown Switcher giữa các Tenant (Dành cho Admin).
  - `AuthProvider.tsx`: React Context bọc ở `layout.tsx` chặn truy cập trái phép.
  - `ThemeToggle.tsx`: Nút bật/tắt Dark Mode.
- **MasterData Components:**
  - `PartnerDataTable.tsx`: Bảng dữ liệu chính, sử dụng `@radix-ui/react-table` (shadcn).
  - `PartnerDialog.tsx`: Modal pop-up sử dụng `react-hook-form` và `zod` để validate form đối tác.

### Services (`lib/api/`)
- `auth-service.ts`: Xử lý HTTP request gọi API Login/Signup.
- `masterdata-service.ts`: Chứa các hàm `getPartners`, `createPartner`, `updatePartner`, `deactivatePartner`.
