# Tổng quan Triển khai Frontend cho WMS - Module Outbound (Xuất kho)

Tài liệu này phác thảo kế hoạch phát triển Frontend cho phân hệ Quản lý Xuất kho (Outbound) trong hệ thống WMS. Outbound bao gồm tất cả các nghiệp vụ từ khi nhận đơn hàng xuất, lập kế hoạch lấy hàng (Wave), chia chọn (Put-to-wall), đóng gói (Pack) và giao cho đơn vị vận chuyển (Dispatch).

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Quản lý Đơn Xuất Kho (Outbound Orders)
- **Mục đích:** Xem, theo dõi và thao tác thủ công (nếu cần) đối với các lệnh xuất kho.
- **Tính năng:**
  - Bảng danh sách `OutboundOrders` (Trạng thái: New, Allocated, Picking, Picked, Packed, Shipped...).
  - Trang chi tiết Đơn xuất: Hiển thị các `PickTasks` liên quan, `Tracking Timeline` (Lịch sử trạng thái), và `Shipment` được gán.
  - Các nút hành động thủ công cho 1 đơn (Manual Mode): **Allocate** (Giữ hàng) -> **Pick** (Tạo task lấy hàng) -> **Pack** (Đóng gói) -> **Ship** (Chuyển sang trạng thái sẵn sàng giao) -> **Cancel** (Hủy đơn).

### 1.2. Wave Planning (Lập kế hoạch sóng xuất kho)
- **Mục đích:** Tối ưu hóa việc lấy hàng bằng cách gom nhiều đơn hàng lại thành một đợt lấy hàng duy nhất (Wave).
- **Tính năng:**
  - Màn hình Wave Planning: Nút "Chạy thuật toán Auto-plan Waves".
  - Hiển thị danh sách các đợt sóng (Waves) vừa được tạo (Phân loại: Single-Item Wave, Multi-Item Wave).
  - Nút "Bắt đầu Wave" để in phiếu lấy hàng hoặc đẩy danh sách xuống máy Scanner của nhân viên Picker.

### 1.3. Lấy hàng (Picking - Scanner UI)
- **Mục đích:** Hướng dẫn nhân viên di chuyển tối ưu nhất trong kho để lấy hàng.
- **Tính năng:**
  - Màn hình hiển thị danh sách các `PickTasks` đã được tối ưu đường đi (Tích hợp Smart Routing).
  - Giao diện quét (Scanner): Nhân viên đến đúng vị trí kệ (Bin), scan mã SKU và nhập số lượng lấy.
  - Nút **Confirm Pick** để hoàn tất một dòng lấy hàng.

### 1.4. Chia chọn & Đóng gói (Put-to-Wall & Packing)
- **Mục đích:** Phân loại hàng hóa từ xe gom hàng (Picking Cart) vào từng rổ/ô nhỏ (Wall) tương ứng với từng đơn hàng cụ thể, sau đó đóng gói.
- **Tính năng:**
  - Giao diện Put-to-wall (Dành cho màn hình cảm ứng / Tablet tại trạm chia hàng): Nhân viên scan mã SKU, màn hình hiển thị to rõ vị trí Ô số mấy cần bỏ vào (Ví dụ: "Bỏ vào ô A-01").
  - Khi ô đầy (đã đủ hàng cho 1 đơn), hiển thị nút **Pack** để in nhãn vận đơn (Shipping Label) và dán lên thùng.

### 1.5. Điều phối Vận chuyển & Xử lý Trả hàng (Dispatch & Returns)
- **Mục đích:** Bàn giao hàng cho tài xế giao hàng và xử lý hàng hoàn (RTO).
- **Tính năng:**
  - Màn hình Sort Order (Chia chọn tuyến đường): Giao hàng cho Last-mile (Tạo kiện hàng Shipment dựa trên Destination).
  - Nút **Dispatch Shipment**: Chuyển trạng thái xuất kho thành công.
  - Màn hình Xử lý Trả hàng (Returns): Ghi nhận hàng hoàn (`ReturnShipment`), kiểm tra tình trạng hàng (Condition: Tốt, Hỏng) và ra quyết định (Disposition: Cất lại vào kho, Tiêu hủy).

---

## 2. Danh Sách API Backend Tích Hợp

Service: `Warehouse.Api` (Controller: `OutboundController`)

| Phân nhóm | Method | Endpoint | Payload / Mô tả |
| :--- | :--- | :--- | :--- |
| **Order Base** | `GET` | `/api/outbound/orders/{id}` | Lấy chi tiết đơn xuất kho |
| | `GET` | `/api/outbound/orders/{id}/tracking-timeline` | Lấy timeline lịch sử |
| | `POST` | `/api/outbound/orders/{id}/split` | Tách đơn hàng (nếu thiếu hụt 1 phần hàng) |
| | `POST` | `/api/outbound/orders/{id}/cancel` | Hủy lệnh xuất |
| **Manual Flow**| `POST` | `/api/outbound/orders/{id}/allocate` | Cấp phát tồn kho |
| | `POST` | `/api/outbound/orders/{id}/pick` | Lấy hàng thủ công (không qua Wave) |
| | `POST` | `/api/outbound/orders/{id}/pack` | Đóng gói đơn |
| | `POST` | `/api/outbound/orders/{id}/ship` | Chuyển sang khu vực xuất |
| **Wave/Pick** | `POST` | `/api/outbound/waves/auto-plan` | Chạy thuật toán gom đơn (Wave) |
| | `GET` | `/api/outbound/waves/{waveId}/pick-tasks` | Lấy lộ trình Picking đã tối ưu |
| | `POST` | `/api/outbound/pick-tasks/{taskId}/confirm` | Xác nhận nhân viên đã lấy 1 mặt hàng |
| **Put-to-Wall**| `POST` | `/api/outbound/waves/{waveId}/put-to-wall` | Chia chọn hàng hóa sau khi Pick gom |
| **Dispatch** | `PUT` | `/api/outbound/sort` | Chia chọn lô hàng để tạo kiện Shipment |
| | `POST` | `/api/outbound/shipments/{id}/dispatch` | Chốt giao hàng cho tài xế |
| **Returns** | `POST` | `/api/outbound/shipments/{id}/return` | Bắt đầu quy trình hàng hoàn |
| | `POST` | `/api/outbound/returns/disposition` | Xử lý trạng thái hàng hoàn (Tốt/Hỏng) |
| | `POST` | `/api/outbound/orders/{id}/putaway` | Cất lại hàng khi bị Hủy (Cancel Order) |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/wms-outbound.ts`:

```typescript
export type OutboundOrderStatus = 'New' | 'Allocating' | 'Allocated' | 'AwaitingPick' | 'Picking' | 'Picked' | 'Packing' | 'Packed' | 'Shipped' | 'Cancelled';

export interface OutboundOrderDto {
  id: string;
  orderNo: string;
  tenantId: string;
  status: OutboundOrderStatus;
  lines: OutboundOrderLineDto[];
}

export interface PickTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string;
  status: 'Pending' | 'Completed';
  routeSequence?: number; // Dùng để tối ưu đường đi
}

export interface PutToWallResult {
  isComplete: boolean;
  orderId: string;
  wallSlotCode: string; // Ô số mấy
  message: string;
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/wms/outbound/orders/page.tsx`: Danh sách lệnh xuất kho.
- `app/(dashboard)/wms/outbound/orders/[id]/page.tsx`: Chi tiết một đơn xuất kho.
- `app/(dashboard)/wms/outbound/waves/page.tsx`: Quản lý sóng (Wave Planning).
- `app/(dashboard)/wms/outbound/picking/page.tsx`: Màn hình Scanner cho Picker.
- `app/(dashboard)/wms/outbound/put-to-wall/page.tsx`: Giao diện trạm đóng gói chia hàng.
- `app/(dashboard)/wms/outbound/dispatch/page.tsx`: Màn hình Dispatch và Sorting.
- `app/(dashboard)/wms/outbound/returns/page.tsx`: Màn hình nhận và kiểm định hàng hoàn (RTO).

### Components (`components/wms/outbound/`)
- `OutboundOrderTable.tsx`: Bảng dữ liệu lọc trạng thái.
- `WaveControlPanel.tsx`: Giao diện cấu hình và chạy thuật toán Auto-Plan Waves.
- `OptimizedPickPath.tsx`: Component hiển thị danh sách dạng thẻ (Card) của Pick Tasks, xếp theo thứ tự `routeSequence`.
- `PutToWallStation.tsx`: Màn hình lớn (Large UI) hiển thị lưới các ô Wall Slot, đổi màu khi một ô đã đầy để nhân viên Pack.
- `DispositionForm.tsx`: Form chọn tình trạng hàng hóa (Condition) và Hành động xử lý (Cất lại / Tiêu hủy) cho hàng hoàn.

### Services (`lib/api/`)
- `wms-outbound.ts`: Các hàm fetch (`getOrder`, `autoPlanWaves`, `getOptimizedPickTasks`, `confirmPickTask`, `putToWall`, `processDisposition`, `dispatchShipment`, v.v.).
