# Tổng quan Triển khai Frontend cho WMS - Module Cross-Docking (Luân chuyển thẳng)

Tài liệu này phác thảo kế hoạch phát triển Frontend cho phân hệ Cross-Docking (Luân chuyển thẳng) trong hệ thống WMS. Cross-docking là quy trình chuyển hàng trực tiếp từ khu vực nhập (Inbound) sang khu vực xuất (Outbound) mà không cần qua bước lưu trữ (Storage), giúp tối ưu hóa thời gian và chi phí lưu kho.

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Dashboard / Danh sách Tác vụ Cross-Docking
- **Mục đích:** Quản lý kho theo dõi các tác vụ luân chuyển hàng hóa khẩn cấp đang diễn ra.
- **Tính năng:**
  - Bảng danh sách các `CrossDockTask` (Trạng thái: Pending, InProgress, Completed, Failed).
  - Cột thông tin hiển thị rõ: 
    - **Nguồn (Source):** Liên kết với Phiếu nhập (Inbound Receipt).
    - **Đích (Destination):** Liên kết với Đơn xuất kho (Outbound Order) đang chờ hàng.
    - **Vị trí hiện tại:** Kệ staging nhập hàng (Inbound Staging Bin).
    - **Vị trí cần đến:** Kệ staging xuất hàng (Outbound Staging Bin).

### 1.2. Màn hình Xử lý Cross-Docking (Dành cho Scanner)
- **Mục đích:** Giao diện tối giản dành cho nhân viên kho (Operator/Forklift driver) sử dụng máy quét mã vạch để di chuyển hàng hóa.
- **Tính năng:**
  - Nhân viên chọn tác vụ hoặc quét mã SKU của kiện hàng vừa cập bến (thuộc diện Cross-dock).
  - Hệ thống hiển thị cảnh báo (Còi/Màu đỏ) để báo hiệu: **"HÀNG CROSS-DOCK - KHÔNG CẤT LÊN KỆ LƯU TRỮ!"**
  - Hiển thị chỉ dẫn: Yêu cầu nhân viên mang hàng trực tiếp sang khu vực Xuất kho (Ví dụ: "Vui lòng di chuyển đến Kệ Outbound-01").
  - Nhân viên đến nơi, quét mã kệ đích (Scanned Destination Bin Code) để hoàn tất tác vụ.

### 1.3. Liên kết với Inbound & Outbound
- Mặc dù là một module riêng biệt, trên giao diện Inbound (Khi nhận hàng), hệ thống FE cần hiển thị cờ (Flag) "Cross-Dock" nổi bật.
- Tương tự, trên giao diện Outbound Order, cần hiển thị cảnh báo "Đang chờ hàng luân chuyển thẳng (Awaiting Cross-Dock)" thay vì trạng thái "Allocated" thông thường.

---

## 2. Danh Sách API Backend Tích Hợp

Service: `Warehouse.Api` (Controller: `InboundController`)

| Method | Endpoint | Payload / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inbound/cross-dock-tasks` | `?status=Pending` | *(Dự kiến)* Lấy danh sách các tác vụ Cross-Docking đang chờ xử lý. |
| `POST` | `/api/inbound/cross-dock/{taskId}/complete` | `{ scannedDestinationBinCode }` | Xác nhận nhân viên đã mang hàng đến kệ xuất (Outbound Staging Bin) thành công. |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/wms-crossdock.ts`:

```typescript
export type CrossDockTaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed';

export interface CrossDockTaskDto {
  id: string;
  tenantId: string;
  inboundReceiptId: string;
  outboundOrderId: string;
  sku: string;
  quantity: number;
  
  // Vị trí hàng đang nằm (Sau khi Receive xong)
  inboundStagingBinId: string; 
  inboundStagingBinCode: string;

  // Vị trí hàng cần đến
  outboundStagingBinId: string;
  outboundStagingBinCode: string;

  status: CrossDockTaskStatus;
  operatorId?: string;
  completedAt?: string;
}

export interface CompleteCrossDockTaskRequest {
  scannedDestinationBinCode: string;
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/wms/tasks/cross-dock/page.tsx`: Màn hình danh sách tổng hợp tất cả các tác vụ Cross-Docking. (Thường gộp chung vào phân hệ Tasks nội bộ).

### Components (`components/wms/crossdock/`)
- `CrossDockDataGrid.tsx`: Bảng dữ liệu hiển thị các tác vụ, có badge cảnh báo độ ưu tiên cao.
- `CrossDockScanner.tsx`: Component giao diện ưu tiên máy quét (tương tự như `PutawayScanner` nhưng có màu sắc cảnh báo đặc biệt - ví dụ màu Cam/Đỏ) để hướng dẫn nhân viên di chuyển từ Inbound sang Outbound.

### Services (`lib/api/`)
- `wms-crossdock.ts`: Chứa các hàm fetch (`getCrossDockTasks`, `completeCrossDockTask`).
