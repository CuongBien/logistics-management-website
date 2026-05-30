# Tổng quan Triển khai Frontend cho OMS - Module Orders (Quản lý Đơn hàng Admin)

Tài liệu này phác thảo kế hoạch và đặc tả kỹ thuật chi tiết của phân hệ **Orders Management (Quản lý đơn hàng Admin)** trong hệ thống OMS, tương ứng với mã nguồn hiện tại của trang quản trị đơn hàng tập trung.

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Tra cứu & Giám sát Đơn hàng (Order Search & Details)
- **Giao diện:** Thanh tìm kiếm GUID và Khối hiển thị chi tiết (Order Details Panel).
- **Tính năng:**
  - Nhập mã định danh duy nhất của đơn hàng (GUID) để truy xuất dữ liệu.
  - Sử dụng cơ chế tải song song để tối ưu tốc độ phản hồi.
  - Hiển thị đầy đủ thông tin hành chính của đơn hàng:
    - Mã vận đơn (`Waybill Code`), Mã định danh (`Order ID`).
    - Số tiền thu hộ (`COD Amount`), Phí vận chuyển (`Shipping Fee`), Trọng lượng (`Weight`).
    - Mã chủ hàng (`Consignor ID`), Ngày tạo đơn (`Created At`), Số lần nỗ lực giao hàng (`Delivery Attempts`).
    - Ghi chú điều phối (`Note`).

### 1.2. Tạo Đơn Hàng Nhanh (Create Order Dialog)
- **Mục đích:** Giao diện cho Điều phối viên (Operator/Admin) tạo đơn hàng giả lập đưa vào luồng kiểm thử hệ thống.
- **Tính năng:**
  - Hộp thoại Dialog/Modal trực quan chứa form nhập liệu:
    - **Thông tin hàng hóa:** Danh sách các SKU (comma-separated), Trọng lượng, Phí vận chuyển, Tiền thu hộ COD, Ghi chú.
    - **Thông tin người nhận (Consignee):** Họ tên, Số điện thoại, Địa chỉ chi tiết (Đường phố, Thành phố, Bang/Tỉnh, Quốc gia, Zip Code).
  - Tự động bắt lỗi dữ liệu nhập. Khi tạo thành công, hệ thống hiển thị thông báo Toast, tự động đóng Dialog và tự động kích hoạt tìm kiếm đơn hàng vừa tạo.

### 1.3. Lịch Trình Trạng Thái (Status Timeline)
- **Mục đích:** Trực quan hóa tiến trình và vết lịch sử thay đổi trạng thái của đơn hàng trong hệ thống (Outbox Pattern & MassTransit Events).
- **Tính năng:**
  - Trục thời gian dọc (Vertical Timeline) nối liền các chốt sự kiện bằng đường line kết nối.
  - Mỗi sự kiện ghi nhận rõ ràng:
    - Bước dịch chuyển trạng thái: `Status From -> Status To` (Ví dụ: `New -> Confirmed`).
    - Thời gian diễn ra sự kiện, Nguồn thay đổi (`Source` - ví dụ: từ ERP, từ SignalR Saga, hoặc tác động tay từ Operator).
    - Các thông tin Trace log: Operator ID, Correlation ID.
    - Ghi chú nguyên nhân (`Reason`) nổi bật bằng màu cảnh báo nếu đơn hàng bị hủy hoặc giao thất bại.

### 1.4. Trạm Hành Động Điều Phối (Dynamic Action Center)
- **Mục đích:** Cho phép Admin thay đổi trạng thái đơn hàng thủ công (Manual Override) thông qua các chốt kiểm soát động tùy theo vòng đời hiện tại của đơn hàng.
- **Tính năng:**
  - **Pickup:** Hiển thị khi đơn hàng ở trạng thái `AwaitingPickup` (yêu cầu nhập `Driver ID` để bưu tá đi lấy hàng).
  - **Dispatch:** Hiển thị khi đơn hàng ở trạng thái `AwaitingDispatch` (yêu cầu nhập `Driver ID` và `Route ID` để gom xe liên tỉnh).
  - **Deliver (Giao thành công):** Hiển thị khi trạng thái là `Dispatched` hoặc `Delivering` (yêu cầu nhập `Proof of Delivery URL` - Ảnh chụp ký nhận).
  - **Fail Delivery (Giao thất bại):** Hiển thị khi trạng thái là `Dispatched` hoặc `Delivering` (yêu cầu nhập lý do chối nhận `Reason`).

---

## 2. Danh Sách API Backend Tích Hợp

Service: `Ordering.Api` (API Gateway Router)

| Method | Endpoint | Payload / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/orders/{id}` | - | Lấy chi tiết thông tin hành chính đơn hàng |
| `GET` | `/api/orders/{id}/status-history` | - | Lấy lịch sử vết trạng thái đơn hàng |
| `GET` | `/api/orders/{id}/consignee` | - | Lấy chi tiết người nhận hàng (Consignee) |
| `POST` | `/api/orders` | `CreateOrderCommand` | Tạo mới đơn hàng cùng thông tin người nhận |
| `PUT` | `/api/orders/{id}/actions/pickup` | `{ driverId }` | Xác nhận bưu tá đã lấy hàng từ chủ shop |
| `PUT` | `/api/orders/{id}/actions/dispatch` | `{ driverId, routeId }` | Phân công tài xế và tuyến xe tải liên tỉnh |
| `PUT` | `/api/orders/{id}/actions/deliver` | `{ proofOfDeliveryUrl }` | Xác nhận shipper chặng cuối đã giao thành công |
| `PUT` | `/api/orders/{id}/actions/fail` | `{ reason }` | Xác nhận bưu tá giao hàng thất bại |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `fe/lib/types.ts`:

```typescript
export type OrderStatus = 
  | 'New' 
  | 'Confirmed' 
  | 'AwaitingPickup' 
  | 'PickedUp' 
  | 'AwaitingInbound' 
  | 'InWarehouse' 
  | 'Sorting' 
  | 'AwaitingDispatch' 
  | 'Dispatched' 
  | 'Delivering' 
  | 'Delivered' 
  | 'Completed' 
  | 'Failed' 
  | 'Cancelled' 
  | 'ReturnInTransit';

export interface OrderAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface OrderConsignee {
  fullName: string;
  phone: string;
  address: OrderAddress;
}

export interface Order {
  id: string;
  waybillCode: string;
  status: OrderStatus;
  codAmount: number;
  shippingFee: number;
  weight: number;
  consignorId: string;
  createdAt: string;
  deliveryAttempts: number;
  note?: string;
  consignee?: OrderConsignee;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  statusFrom?: OrderStatus;
  statusTo: OrderStatus;
  changedAt: string;
  changedByOperatorId?: string;
  correlationId?: string;
  source: string;
  reason?: string;
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/orders/page.tsx`: Màn hình giao diện quản trị Admin của hệ thống OMS (tích hợp Search Engine, Details, Timeline, Actions và Dialog Tạo đơn).

### Components (`components/`)
- Sử dụng các UI primitive dựng sẵn từ thư viện:
  - `@/components/ui/button`: Nút bấm hành động.
  - `@/components/ui/input`: Thanh tìm kiếm và nhập liệu.
  - `@/components/ui/badge`: Huy hiệu phân màu trạng thái.
  - `@/components/ui/tabs`: Chuyển đổi thông tin tab chi tiết.
  - `@/components/ui/dialog`: Hộp thoại modal tạo đơn hàng và xác nhận tác vụ.
  - `@/components/ui/textarea`: Ô nhập ghi chú rộng.

### Services (`lib/`)
- `fe/lib/services/ordering.ts`: API service wrapper chứa các phương thức giao tiếp mạng:
  - `getOrderById(id)`, `getOrderStatusHistory(id)`, `getOrderConsignee(id)`.
  - `createOrder(payload)`.
  - `pickupOrder(id, driverId)`, `dispatchOrder(id, driverId, routeId)`.
  - `deliverOrder(id, podUrl)`, `failDelivery(id, reason)`.
- `fe/lib/types.ts`: Định nghĩa kiểu dữ liệu thống nhất cho toàn bộ dịch vụ.
