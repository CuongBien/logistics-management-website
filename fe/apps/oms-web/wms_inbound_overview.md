# Tổng quan Triển khai Frontend cho WMS - Module Inbound (Nhập kho)

Tài liệu này phác thảo kế hoạch phát triển Frontend cho phân hệ **Inbound Management (Quản lý nhập kho)** trong hệ thống WMS. Inbound là quá trình tiếp nhận hàng hóa từ Supplier/Consignor, kiểm đếm, ghi nhận sự cố (nếu có), và cất hàng lên kệ.

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Quản lý Phiếu Nhập (Inbound Receipts)
- **Giao diện:** Bảng danh sách phiếu nhập (Data Table).
- **Tính năng:**
  - Liệt kê phiếu nhập theo kho (WarehouseId).
  - Tìm kiếm theo `OrderId`, `ReceiptNo`, hoặc `SourceShipmentNo`.
  - Hiển thị trạng thái phiếu nhập (Pending, PartiallyReceived, Received, CompletedWithExceptions).
  - Nút "Tạo Phiếu Nhập" (Thủ công, dù thường hệ thống tự tạo qua EventBus).

### 1.2. Màn hình Scan Nhận Hàng (Receive/Tally)
- **Mục đích:** Giao diện cho nhân viên kho (Checker/Operator) sử dụng máy quét mã vạch (Barcode Scanner) hoặc nhập tay để nhận hàng vào kho.
- **Tính năng:**
  - Input form để scan mã `SkuCode` và mã kệ `BinCode` (Kệ Staging/Receiving).
  - Nhập số lượng (`Quantity`) thực tế nhận được.
  - Hỗ trợ nhập `LotNo` và `ExpiryDate` cho hàng hóa có date.
  - Hiển thị tiến độ nhận hàng (Ví dụ: Đã nhận 50/100 cái).
  - Nút "Đóng phiếu (Force Close)" nếu nhà cung cấp giao thiếu hàng và sẽ không giao thêm.

### 1.3. Quản lý Sự Cố Nhập Kho (OS&D - Over, Short, and Damaged)
- **Mục đích:** Quản lý các biên bản chênh lệch khi hàng thực tế nhận khác với hàng dự kiến.
- **Tính năng:**
  - Danh sách các biên bản Inbound Discrepancy (OS&D) và Transit Discrepancy.
  - Form giải quyết sự cố (Resolve): Cho phép Quản lý kho quyết định duyệt (Approve) hay từ chối (Reject), và nhập ghi chú (Notes).

### 1.4. Quản lý Công Việc Cất Hàng (Putaway Tasks)
- **Mục đích:** Hướng dẫn nhân viên lái xe nâng (Forklift) đưa hàng từ khu vực Receiving vào khu vực lưu trữ (Storage Bins).
- **Tính năng:**
  - Danh sách lệnh Putaway (Hiển thị Source Bin, Suggested Bin).
  - Màn hình hoàn tất Putaway: Nhân viên scan `ActualBinCode` (Mã kệ thực tế cất hàng vào) để xác nhận hệ thống cập nhật Inventory.

### 1.5. Xử lý Cross-docking
- **Mục đích:** Xử lý các kiện hàng không cần lưu trữ mà chuyển thẳng sang khu vực xuất hàng.
- **Tính năng:**
  - Hiển thị danh sách CrossDock Tasks đang chờ.
  - Nhân viên scan mã kệ đích (Thường là Staging/Outbound Bin) để hoàn tất.

---

## 2. Danh Sách API Backend Tích Hợp

Service: `Warehouse.Api` (Controllers: `InboundController`, `PutawayTasksController`)

| Method | Endpoint | Payload / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inbound/receipts/by-order/{orderId}` | `?warehouseId={id}` | Lấy thông tin chi tiết phiếu nhập kèm các dòng (Lines) |
| `POST` | `/api/inbound/receipts` | `CreateInboundReceiptCommand` | Tạo phiếu nhập (nếu tạo thủ công) |
| `PUT` | `/api/inbound/receipts/{receiptId}/receive` | `{ skuCode, binCode, qty, ... }`| Ghi nhận hàng vật lý vào Bin (Nhận hàng) |
| `POST` | `/api/inbound/receipts/{receiptId}/force-close` | - | Đóng cưỡng chế phiếu nhập (Chốt số lượng thực tế) |
| `GET` | `/api/inbound/transit-discrepancies` | Các tham số lọc | Lấy danh sách sự cố trung chuyển |
| `POST` | `/api/inbound/transit-discrepancies/{id}/resolve`| `{ newStatus, notes }` | Xử lý biên bản sự cố trung chuyển |
| `POST` | `/api/inbound/discrepancies/{id}/resolve` | `{ newStatus, notes }` | Xử lý biên bản sự cố nhập kho (OS&D) |
| `POST` | `/api/inbound/putaway-tasks/{taskId}/complete`| `{ scannedDestinationBinCode }` | Xác nhận cất hàng thành công |
| `POST` | `/api/inbound/cross-dock/{taskId}/complete` | `{ scannedDestinationBinCode }` | Xác nhận hàng cross-dock đã đến khu vực xuất |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/wms-inbound.ts`:

```typescript
export type InboundReceiptStatus = 'Pending' | 'PartiallyReceived' | 'Received' | 'CompletedWithExceptions' | 'Closed' | 'Cancelled';
export type DiscrepancyStatus = 'Pending' | 'ResolvedApprove' | 'ResolvedReject';

export interface InboundReceiptLineDto {
  id: string;
  sku: string;
  expectedQuantity: number;
  receivedQuantity: number;
}

export interface InboundReceiptDto {
  id: string;
  receiptNo: string;
  orderId: string;
  status: InboundReceiptStatus;
  lines: InboundReceiptLineDto[];
}

export interface DiscrepancyDto {
  id: string;
  type: 'Over' | 'Short' | 'Damage';
  sku: string;
  expectedQty: number;
  actualQty: number;
  status: DiscrepancyStatus;
  notes?: string;
}

export interface PutawayTaskDto {
  id: string;
  sku: string;
  quantity: number;
  sourceBinId: string; // Kệ nhận hàng ban đầu
  suggestedBinId: string; // Kệ hệ thống gợi ý cất vào
  status: 'Pending' | 'Completed' | 'Cancelled';
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/wms/inbound/receipts/page.tsx`: Danh sách phiếu nhập.
- `app/(dashboard)/wms/inbound/receipts/[id]/page.tsx`: Chi tiết phiếu nhập & Màn hình Scan Nhận Hàng (Tally).
- `app/(dashboard)/wms/inbound/putaway/page.tsx`: Danh sách tác vụ cất hàng (Putaway Tasks).
- `app/(dashboard)/wms/inbound/osd/page.tsx`: Danh sách và xử lý sự cố (OS&D Discrepancies).
- `app/(dashboard)/wms/inbound/cross-dock/page.tsx`: Danh sách tác vụ Cross-docking.

### Components (`components/wms/inbound/`)
- `ReceiptsTable.tsx`: Bảng dữ liệu phiếu nhập.
- `ScannerInput.tsx`: Component Form đặc thù để focus liên tục cho máy quét mã vạch (Barcode Scanner).
- `ReceiveItemForm.tsx`: Form nhập `SkuCode`, `BinCode`, `Quantity` và gọi API `/receive`.
- `ForceCloseDialog.tsx`: Modal xác nhận trước khi Force Close phiếu nhập.
- `PutawayTaskCard.tsx`: Thẻ công việc hiển thị chỉ dẫn (Từ Bin A -> Gợi ý cất vào Bin B) kèm ô nhập `Actual Bin`.
- `DiscrepancyResolveModal.tsx`: Modal cho phép Admin Approve/Reject sự cố và điền lý do.

### Services (`lib/api/`)
- `wms-inbound.ts`: Chứa các hàm fetch (`getReceipt`, `receiveItem`, `forceClose`, `resolveDiscrepancy`, `completePutaway`).
