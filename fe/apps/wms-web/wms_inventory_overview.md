# Tổng quan Triển khai Frontend cho WMS - Module Quản lý Tồn kho (Inventory Management)

Tài liệu này phác thảo kế hoạch phát triển Frontend cho phân hệ Quản lý Tồn kho trong hệ thống WMS. Đây là nơi kiểm soát dòng chảy của hàng hóa, bảo lưu (Reserve), luân chuyển (Transfer), và truy xuất lịch sử thay đổi (Ledger).

---

## 1. Các Tính Năng Frontend Cần Triển Khai

### 1.1. Bảng điều khiển Tồn kho (Inventory Dashboard)
- **Mục đích:** Cung cấp cái nhìn toàn cảnh về lượng hàng hóa đang được lưu trữ.
- **Tính năng:**
  - Hiển thị tổng quan `QuantityOnHand` (Tổng hàng vật lý) và số lượng SKU độc nhất (Sử dụng API Dashboard).
  - Danh sách hàng hóa tồn kho (Inventory Items) kèm theo các bộ lọc: Tìm theo SKU, Tìm theo Bin (vị trí), Tìm theo Lô (LotNo) hoặc Tenant.

### 1.2. Sổ cái Tồn kho (Inventory Ledger / Lịch sử luân chuyển)
- **Mục đích:** Theo dõi mọi sự kiện làm thay đổi số lượng hàng hóa (Nhập, Xuất, Chuyển kệ, Hư hỏng...).
- **Tính năng:**
  - Giao diện Timeline hoặc Bảng lịch sử (Ledger Table).
  - Khi click vào một lô hàng (`InventoryItemId`), hiển thị tất cả các giao dịch (Transactions): 
    - `TransactionType` (Receipt, Putaway, Pick, Adjust, v.v.).
    - `DeltaQty` (Số lượng thay đổi: + hoặc -).
    - `ReferenceId` (Mã phiếu nhập/xuất liên quan).

### 1.3. Điều chuyển nội bộ (Internal Transfer)
- **Mục đích:** Cho phép Admin hoặc Quản lý kho dời hàng từ kệ này sang kệ khác một cách thủ công (Không thông qua hệ thống tự sinh Task).
- **Tính năng:**
  - Modal Form: Nhập `Source Bin`, `Destination Bin`, `SKU`, `Số lượng`.
  - Hữu ích khi dồn kệ (Consolidation) hoặc cách ly hàng lỗi.

### 1.4. Quản lý Bảo lưu Tồn kho (Stock Reservation)
- **Mục đích:** Xem và thao tác giữ/nhả hàng hóa (Thường được hệ thống tự gọi thông qua Outbound, nhưng Admin có thể can thiệp).
- **Tính năng:**
  - Nút "Reserve Stock" (Giữ hàng thủ công cho một Tenant/Order).
  - Nút "Release Stock" (Nhả hàng đang giữ nếu đơn bị hủy).
  - Nút "Consume Stock" (Trừ tồn kho khi hàng thực sự được xuất đi).

### 1.5. Cân bằng kho (Reconcile Inventory)
- **Mục đích:** Đồng bộ dữ liệu sửa đổi sau quá trình Kiểm kê (Cycle Count) hoặc sửa lỗi dữ liệu.
- **Tính năng:**
  - Giao diện cho phép Admin trực tiếp cộng/trừ số lượng hàng hóa trên một kệ nhất định kèm theo lý do (Reason Code).

---

## 2. Danh Sách API Backend Tích Hợp

Service: `Warehouse.Api` (Controller: `InventoryController`)

| Method | Endpoint | Payload / Params | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/inventory-stats` | (Tenant/Admin) | Lấy tổng quan tồn kho (API từ Dashboard Controller) |
| `GET` | `/api/inventory/{inventoryItemId}/ledger` | - | Lấy lịch sử biến động sổ cái của một Item |
| `POST` | `/api/inventory/transfer` | `{ sourceBin, destBin, sku, qty }` | Di chuyển hàng giữa 2 Bin |
| `POST` | `/api/inventory/reserve` | `{ orderId, sku, qty, ... }` | Giữ hàng cho đơn xuất |
| `POST` | `/api/inventory/release` | `{ orderId, sku, qty }` | Giải phóng hàng đang giữ |
| `POST` | `/api/inventory/consume` | `{ orderId, sku, qty }` | Trừ tồn kho vĩnh viễn (đã xuất) |
| `POST` | `/api/inventory/reconcile` | `{ binCode, sku, actualQty, reason }`| Điều chỉnh chênh lệch tồn kho |

---

## 3. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/wms-inventory.ts`:

```typescript
export interface InventoryItemDto {
  id: string;
  tenantId: string;
  sku: string;
  binCode: string;
  quantityOnHand: number;
  availableQuantity: number; // = QuantityOnHand - Reserved
  lotNo?: string;
  expiryDate?: string;
}

export type LedgerTransactionType = 'Receipt' | 'Putaway' | 'Pick' | 'Pack' | 'Ship' | 'Adjust' | 'Transfer' | 'CycleCount';

export interface InventoryLedgerDto {
  id: string;
  inventoryItemId: string;
  transactionType: LedgerTransactionType;
  deltaQty: number; // +/-
  balanceAfter: number;
  referenceId: string;
  occurredAt: string;
  operatorId: string;
}

export interface ReconcileRequest {
  tenantId: string;
  warehouseId: string;
  binCode: string;
  sku: string;
  actualQuantity: number;
  reason: string;
}
```

---

## 4. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/wms/inventory/page.tsx`: Màn hình danh sách tồn kho tổng quan.
- `app/(dashboard)/wms/inventory/[itemId]/page.tsx`: Màn hình chi tiết một lô hàng (Hiển thị thẻ thông tin & Ledger Table).

### Components (`components/wms/inventory/`)
- `InventoryDataTable.tsx`: Bảng dữ liệu chính, hiển thị trạng thái Hàng có sẵn (`AvailableQty`) vs Hàng bị khóa (`Reserved`).
- `LedgerHistoryTable.tsx`: Bảng lịch sử giao dịch. Hiển thị màu xanh dương cho số `+` và đỏ cho số `-`.
- `TransferStockDialog.tsx`: Modal cho tính năng Điều chuyển nội bộ (Transfer).
- `ReconcileDialog.tsx`: Modal Cân bằng tồn kho (Reconcile), bắt buộc nhập Lý do.
- `ReserveActionsDropdown.tsx`: Dropdown menu ở cột cuối Data Table để Admin chọn thao tác Reserve/Release thủ công.

### Services (`lib/api/`)
- `wms-inventory.ts`: Các hàm fetch (`getInventoryStats`, `getLedger`, `transferStock`, `reserveStock`, `releaseStock`, `consumeStock`, `reconcile`).
