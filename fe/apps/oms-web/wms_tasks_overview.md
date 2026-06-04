# Tổng quan Triển khai Frontend cho WMS - Module Nhiệm vụ Nội bộ (Putaway, Replenishment & Cycle Count)

Tài liệu này phác thảo kế hoạch phát triển Frontend cho các nghiệp vụ điều phối công việc bên trong kho (Internal Tasks). Các nghiệp vụ này bao gồm: Cất hàng (Putaway), Bổ sung hàng (Replenishment) và Kiểm kê kho (Cycle Count).

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Putaway Management (Quản lý cất hàng)
- **Mục đích:** Điều hướng nhân viên đưa hàng từ khu vực tiếp nhận (Receiving/Staging) vào đúng vị trí kệ lưu trữ (Storage Bins).
- **Tính năng:**
  - Danh sách các công việc Putaway chưa hoàn thành (Pending).
  - Hiển thị rổ hàng (SKU, Số lượng), Kệ xuất phát (Source Bin) và Kệ đích đề xuất (Suggested Bin).
  - **Màn hình Scanner (Handheld UI):** Nhân viên đến vị trí cất hàng, quét (scan) mã kệ thực tế (`ActualBinCode`) và nhấn Hoàn tất. Hệ thống sẽ ghi nhận hàng đã lên kệ.

### 1.2. Replenishment Management (Bổ sung hàng hóa)
- **Mục đích:** Bổ sung hàng hóa từ khu vực Lưu trữ (Storage/Reserve) ra khu vực Lấy hàng (Pick Face) để chuẩn bị cho quá trình xuất kho (Outbound).
- **Tính năng:**
  - Nút "Chạy thuật toán Replenishment" để hệ thống tự quét mức tồn kho tối thiểu (Min-Max) và sinh ra các tác vụ Bổ sung.
  - Danh sách công việc Replenishment (Hiển thị Từ Kệ A -> Đến Kệ B).
  - Màn hình Scanner để nhân viên xác nhận hoàn tất tác vụ sau khi đã di chuyển hàng.

### 1.3. Cycle Count (Kiểm kê định kỳ)
- **Mục đích:** Kiểm tra và đối soát số lượng tồn kho thực tế so với dữ liệu trên phần mềm (Ledger).
- **Tính năng:**
  - Nút "Tạo tác vụ Kiểm kê" dựa trên cấu hình (Kho, Khu vực, Số lượng task tối đa).
  - Giao diện đếm hàng (Counting UI) cho nhân viên kho: Hiển thị Bin cần kiểm tra, ẩn số lượng trên hệ thống (Blind Count). Nhân viên đếm và nhập số lượng thực tế (`CountedQty`).
  - Màn hình duyệt (Approve Adjustment) dành cho Quản lý kho: Nếu số lượng đếm được khác hệ thống, Quản lý kho sẽ xem xét và nhấn Duyệt để hệ thống tự động ghi sổ (Ledger Adjustment).

---

## 2. Danh Sách API Backend Tích Hợp

Service: `Warehouse.Api` (Controllers: `PutawayTasksController`, `InventoryTasksController`)

| Method | Endpoint | Payload / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inbound/putaway-tasks` | `?status=Pending` | *(Dự kiến)* Lấy danh sách task Putaway |
| `POST` | `/api/inbound/putaway-tasks/{taskId}/complete`| `{ scannedDestinationBinCode }` | Hoàn tất cất hàng lên kệ |
| `POST` | `/api/inventory/tasks/replenish/generate` | `?tenantId={id}&warehouseId={id}` | Chạy thuật toán tạo task Bổ sung |
| `GET` | `/api/inventory/tasks/replenish` | `?status=Pending` | *(Dự kiến)* Lấy danh sách task Replenishment |
| `POST` | `/api/inventory/tasks/replenish/{taskId}/complete`| - | Xác nhận hoàn tất Bổ sung hàng |
| `POST` | `/api/inventory/tasks/cycle-count/generate` | `?tenantId={id}&warehouseId={id}&maxTasks=10`| Tạo ngẫu nhiên các task Kiểm kê kho |
| `POST` | `/api/inventory/tasks/cycle-count/{taskId}/submit`| `{ countedQty }` | Nhân viên kho nộp kết quả đếm |
| `POST` | `/api/inventory/tasks/cycle-count/{taskId}/approve`| - | Quản lý kho duyệt kết quả chênh lệch |

*(Lưu ý: Các API GET danh sách task hiện chưa có route riêng lẻ ở Controller, chúng ta sẽ cần bổ sung Query cho chúng trong quá trình tích hợp).*

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/wms-tasks.ts`:

```typescript
export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';

export interface PutawayTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string;
  suggestedBinId: string;
  status: TaskStatus;
}

export interface ReplenishmentTaskDto {
  id: string;
  sku: string;
  quantity: number;
  fromBinId: string; // Kệ lưu trữ
  toBinId: string;   // Kệ lấy hàng (Pick Face)
  status: TaskStatus;
}

export interface CycleCountTaskDto {
  id: string;
  binId: string;
  sku: string;
  expectedQty: number; // Có thể ẩn đối với nhân viên đếm (Blind Count)
  countedQty?: number;
  status: 'Pending' | 'Counted' | 'Approved' | 'Rejected';
  operatorId?: string;
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/wms/tasks/putaway/page.tsx`: Danh sách & Giao diện xử lý Putaway.
- `app/(dashboard)/wms/tasks/replenishment/page.tsx`: Danh sách & Giao diện xử lý Replenishment.
- `app/(dashboard)/wms/tasks/cycle-count/page.tsx`: Danh sách kiểm kê & Phê duyệt (Dành cho Quản lý).
- `app/(dashboard)/wms/tasks/cycle-count/scan/page.tsx`: Màn hình đếm hàng chuyên dụng (Dành cho Scanner).

### Components (`components/wms/tasks/`)
- `TaskDataGrid.tsx`: Bảng dữ liệu chung hiển thị các Task.
- `PutawayScanner.tsx`: Giao diện tối giản để nhân viên lái xe nâng xem hướng dẫn và quét mã kệ.
- `ReplenishGenerator.tsx`: Card/Form để chọn kho và kích hoạt thuật toán sinh task bổ sung.
- `BlindCountForm.tsx`: Form nhập số lượng đếm được cho Cycle Count (Giao diện số lớn, phím to dành cho tablet/máy quét).
- `AdjustmentApprovalDialog.tsx`: Modal hiển thị chênh lệch (Expected vs Counted) để Quản lý kho xem xét trước khi Approve.

### Services (`lib/api/`)
- `wms-tasks.ts`: Chứa các hàm gọi `completePutawayTask`, `generateReplenishment`, `completeReplenishment`, `generateCycleCount`, `submitCount`, `approveCount`.
