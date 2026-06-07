# Tổng quan Triển khai Frontend cho Order Management System (OMS)

Tài liệu này phác thảo các tính năng, API, thực thể và cấu trúc file cần triển khai trên hệ thống Frontend (Next.js) dành cho phân hệ Quản lý đơn hàng (OMS).

---

## 1. Các Tính Năng Chính Cần Triển Khai

### 1.1. Dashboard (Tổng quan đơn hàng)
- **Mục đích:** Hiển thị cái nhìn tổng quan về tình trạng đơn hàng và dòng tiền (COD/Shipping).
- **Tính năng:**
  - Biểu đồ tròn/donut thống kê trạng thái đơn hàng (Mới, Đang giao, Thành công, Hủy, v.v.).
  - Thẻ thông tin (Cards) hiển thị dự kiến thu hộ (Total COD Expected) và doanh thu phí vận chuyển (Total Shipping Revenue).
  - (Tùy chọn) Danh sách đơn hàng mới nhất cần xử lý.

### 1.2. Quản lý danh sách Đơn hàng (Order List)
- **Mục đích:** Liệt kê tất cả các đơn hàng, hỗ trợ tìm kiếm và lọc dữ liệu.
- **Tính năng:**
  - Bảng dữ liệu (Data Table) hiển thị mã đơn, trạng thái, người nhận, tiền thu hộ, v.v.
  - Phân trang (Pagination).
  - Bộ lọc (Filter) theo `status`, `type`, `fulfillment`, và ô tìm kiếm `searchTerm`.

### 1.3. Chi tiết Đơn hàng (Order Detail)
- **Mục đích:** Xem toàn bộ thông tin của một đơn hàng cụ thể.
- **Tính năng:**
  - Hiển thị thông tin chung, địa chỉ gửi/nhận (Consignee).
  - Danh sách sản phẩm (Order Items / SKUs).
  - Timeline/Lịch sử trạng thái đơn hàng (Status History).
  - Các nút hành động (Actions) phụ thuộc vào trạng thái hiện tại (Ví dụ: Cancel, Dispatch, Deliver...).

### 1.4. Tạo mới Đơn hàng (Create Order / Inbound Request)
- **Mục đích:** Giao diện cho chủ hàng (Consignor) hoặc Admin tạo đơn mới.
- **Tính năng:**
  - Form nhập liệu chia bước (Stepper) hoặc Tabs (Thông tin người nhận -> Thông tin hàng hóa -> Phương thức vận chuyển).
  - Validation dữ liệu chặt chẽ bằng `react-hook-form` + `zod`.

---

## 2. Danh Sách Các API Backend Cần Tích Hợp

Các API này thuộc về Service `Ordering.Api`:

### Dashboard API
| Method | Endpoint | Payload | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/status-summary` | (TenantId auto-filtered) | Thống kê số lượng đơn theo nhóm trạng thái |
| `GET` | `/api/dashboard/financials` | (TenantId auto-filtered) | Thống kê doanh thu COD & Shipping fee |

### Orders API
| Method | Endpoint | Payload | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | Query params (page, status, etc.) | Lấy danh sách đơn hàng có phân trang |
| `GET` | `/api/orders/{id}` | - | Lấy thông tin chi tiết đơn hàng |
| `GET` | `/api/orders/{id}/consignee` | - | Lấy thông tin người nhận hàng |
| `GET` | `/api/orders/{id}/status-history` | - | Lấy lịch sử thay đổi trạng thái |
| `POST` | `/api/orders` | `CreateOrderCommand` | Tạo đơn hàng mới. Hỗ trợ 2 chế độ (FulfillmentMode): <br/>1. **Pickup**: Lấy hàng từ Consignor giao đi.<br/>2. **Warehouse (Outbound)**: Xuất hàng tồn kho giao đi. |
| `POST` | `/api/orders/inbound-request` | `CreateInboundRequestCommand`| Tạo yêu cầu nhập kho từ Consignor |

### Order Actions API (`/api/orders/{orderId}/actions`)
| Method | Endpoint | Payload | Mô tả |
| :--- | :--- | :--- | :--- |
| `PUT` | `/api/orders/{orderId}/actions/pickup` | `{ driverId }` | Xác nhận tài xế đã lấy hàng |
| `PUT` | `/api/orders/{orderId}/actions/dispatch` | `{ driverId, routeId }`| Phân công tài xế và tuyến đường |
| `PUT` | `/api/orders/{orderId}/actions/deliver` | `{ proofOfDeliveryUrl }` | Xác nhận giao thành công |
| `PUT` | `/api/orders/{orderId}/actions/fail` | `{ reason }` | Xác nhận giao hàng thất bại |
| `PUT` | `/api/orders/{orderId}/actions/cancel` | `{ reason }` | Hủy đơn hàng |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Cần định nghĩa các TypeScript interfaces sau trong thư mục `types` của frontend:

```typescript
// types/oms.ts

export type OrderStatus = 'New' | 'Confirmed' | 'AwaitingPickup' | 'PickedUp' | 'AwaitingInbound' | 'InWarehouse' | 'Sorting' | 'AwaitingDispatch' | 'Dispatched' | 'Delivering' | 'Delivered' | 'Completed' | 'Failed' | 'Cancelled' | 'ReturnInTransit';

export interface OrderSummaryDto {
  id: string;
  orderNo: string;
  status: OrderStatus;
  consigneeName: string;
  consigneeCity: string;
  totalWeight: number;
  codAmount: number;
  createdAt: string;
}

export interface OrderItemDto {
  id: string;
  skuCode: string;
  quantity: number;
  price: number;
}

export interface OrderDto extends OrderSummaryDto {
  tenantId: string;
  consignorId: string;
  notes?: string;
  shippingFee: number;
  items: OrderItemDto[];
}

export interface OrderStatusHistoryDto {
  status: OrderStatus;
  changedAt: string;
  reason?: string;
  changedBy?: string;
}
```

---

## 4. Cấu Trúc File & Thư Mục Frontend Đề Xuất

Dựa trên cấu trúc Next.js App Router hiện có, đây là những file cần được tạo mới hoặc chỉnh sửa:

### 4.1. Routes (Thư mục `app/`)
- `app/(dashboard)/oms/page.tsx`: Dashboard tổng quan (gọi `DashboardController`).
- `app/(dashboard)/oms/orders/page.tsx`: Danh sách đơn hàng (Bảng DataTable kèm Filter).
- `app/(dashboard)/oms/orders/create/page.tsx`: Trang tạo đơn hàng mới.
- `app/(dashboard)/oms/orders/[id]/page.tsx`: Trang chi tiết đơn hàng (Hiển thị tab thông tin, items, history).

### 4.2. Components (Thư mục `components/`)
- **`components/oms/`** (Tạo mới thư mục này)
  - `OrderDataTable.tsx`: Bảng dữ liệu hiển thị đơn hàng (dùng `@radix-ui/react-table` nếu có hoặc setup native HTML table styles của shadcn).
  - `OrderStatusBadge.tsx`: Component hiển thị màu sắc dựa theo `OrderStatus`.
  - `OrderFilters.tsx`: Bộ lọc trạng thái, tìm kiếm.
  - `OrderTimeline.tsx`: Trực quan hóa lịch sử trạng thái của đơn.
  - `OrderForm.tsx`: Form tạo đơn hàng mới, tích hợp `react-hook-form` + `zod`.
  - `OrderActionButtons.tsx`: Các nút Dispatch, Cancel, Deliver kèm theo dialog/modal (dùng `@radix-ui/react-dialog`) để nhập lý do hoặc mã tài xế.

### 4.3. Services/Hooks (Thư mục `lib/` hoặc `hooks/`)
- **`lib/api/oms.ts`**: Nơi chứa các hàm `fetch` gọn gàng gọi lên các endpoint của `Ordering.Api`.
- **`hooks/useOrders.ts`**: Custom hook (SWR hoặc React Query nếu có, hoặc fetch API thuần kết hợp `useEffect`) để fetch danh sách và xử lý state loading/error.

### 4.4. UI Primitives
Tận dụng các UI components có sẵn trong `package.json`:
- `lucide-react`: Biểu tượng (Icons).
- `@radix-ui/react-dialog`: Modals xác nhận khi Cancel/Fail đơn hàng.
- `@radix-ui/react-select`: Dropdown chọn trạng thái trong bộ lọc.
- `@radix-ui/react-tabs`: Chuyển đổi giữa Thông tin chung / Lịch sử / Sản phẩm ở trang chi tiết.
- `recharts`: Vẽ biểu đồ cho trang OMS Dashboard.
- `sonner`: Toast notifications (hiển thị thông báo "Tạo đơn thành công", "Cập nhật thất bại"...).
