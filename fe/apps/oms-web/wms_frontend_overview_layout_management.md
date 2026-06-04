# Tổng quan Triển khai Frontend cho Warehouse Management System (WMS)

Tài liệu này phác thảo kế hoạch phát triển Frontend cho phân hệ Quản lý Kho (WMS), bắt đầu bằng việc chia nhỏ chi tiết Module cốt lõi: **Quản lý Cấu trúc Kho (Warehouse Layout)**.

---

## 1. Các Module Chính Trong WMS (Overview)

Frontend của WMS sẽ là một hệ thống lớn chia thành nhiều Module nhỏ:
1. **Dashboard:** Thống kê sức chứa, lượng công việc tồn đọng, năng suất nhân viên.
2. **Layout Management (Sẽ phân tích chi tiết bên dưới):** Quản lý cấu trúc vật lý của kho (Warehouse, Block, Zone, Bin).
3. **Inbound Management:** Tạo và theo dõi phiếu nhập kho, nhận hàng (Receive), và kiểm đếm Overage/Shortage/Damage (OS&D).
4. **Putaway & Replenishment:** Quản lý lệnh cất hàng lên kệ và bổ sung hàng từ kho tổng ra khu vực lấy hàng (Pick Face).
5. **Inventory Management:** Quản lý tồn kho thực tế, dò tìm vị trí hàng hóa (Ledger, Reservation).
6. **Outbound Management:** Quản lý sóng xuất kho (Wave), lệnh lấy hàng (Pick Tasks), đóng gói (Pack), và xuất kho (Dispatch).
7. **Cross-Docking:** Quản lý quy trình hàng vào và ra trực tiếp không qua lưu trữ.
8. **RBAC & Operator:** Quản lý phân quyền và nhân sự kho.

---

## 2. Chi Tiết Phân Phân Hệ: Quản lý Cấu trúc Kho (Layout Management)

### 2.1. Mục Tiêu
Cung cấp giao diện để Admin (Quản trị viên) thiết lập, xem, và chỉnh sửa cấu trúc vật lý của tất cả các kho bãi trong hệ thống. Hệ thống kho tuân theo cấu trúc phân cấp (Hierarchy): 
**Warehouse -> Block -> Zone -> Bin**.

### 2.2. Các Tính Năng Frontend Cần Triển Khai

#### A. Danh sách các Kho (Warehouse List)
- **Giao diện:** Dạng lưới (Grid/Cards) hoặc Bảng (Table).
- **Tính năng:**
  - Hiển thị danh sách tất cả Warehouse trong hệ thống.
  - Nút "Thêm Kho Mới" mở ra Dialog/Modal form.
  - Click vào một kho sẽ điều hướng đến trang Chi tiết cấu trúc kho (Hierarchy).

#### B. Trực quan hóa Cấu trúc Kho (Warehouse Hierarchy / Layout Builder)
- **Giao diện:** 
  - Một sơ đồ cây (Tree View) dạng thư mục hoặc dạng Card lồng nhau.
  - Cấu trúc: Kho -> chứa nhiều Blocks -> chứa nhiều Zones -> chứa nhiều Bins.
- **Tính năng:**
  - Load toàn bộ cấu trúc kho bằng API `GetWarehouseHierarchy`.
  - Nút "Thêm Block" (ở cấp độ Warehouse).
  - Nút "Thêm Zone" (ở cấp độ Block) kèm theo Dropdown chọn `ZoneType` (Inbound, Outbound, Storage, v.v.).
  - Nút "Thêm Bin" (ở cấp độ Zone) để nhập mã kệ.

#### C. Quản lý trạng thái Bin (Bin Management)
- **Giao diện:** Danh sách các Bin trong một Zone hoặc màn hình tìm kiếm Bin toàn kho.
- **Tính năng:**
  - Hiển thị trạng thái hiện tại của Bin (Available, Occupied, Full, Maintenance, Locked).
  - Cho phép Admin thay đổi trạng thái Bin bằng tay (Ví dụ: Đánh dấu kệ bị hỏng cần sửa chữa `Maintenance`).

---

## 3. Danh Sách API Backend Tích Hợp (Service: `Warehouse.Api`)

Các API liên quan đến Layout nằm trong `WarehouseController`:

| Method | Endpoint | Payload | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/warehouse` | - | Lấy danh sách các kho |
| `GET` | `/api/warehouse/{id}/hierarchy` | - | Lấy cấu trúc cây (Blocks, Zones, Bins) của một kho cụ thể |
| `POST` | `/api/warehouse` | `CreateWarehouseCommand` | Tạo kho mới |
| `POST` | `/api/warehouse/{id}/blocks` | `"blockCode"` (string) | Tạo Block mới thuộc Warehouse |
| `POST` | `/api/warehouse/blocks/{id}/zones` | `ZoneType` (enum) | Tạo Zone mới thuộc Block |
| `POST` | `/api/warehouse/zones/{id}/bins` | `{ warehouseId, binCode }` | Tạo Bin mới thuộc Zone |
| `PUT` | `/api/warehouse/bins/{id}/status` | `{ newStatus }` | Cập nhật trạng thái của Bin (Sửa chữa, khóa...) |

---

## 4. Các Thực Thể (Entities) & Kiểu Dữ Liệu Frontend

Khai báo trong `types/wms-layout.ts`:

```typescript
export type ZoneType = 'Inbound' | 'Storage' | 'Outbound' | 'Return' | 'CrossDock' | 'Staging';
export type BinStatus = 'Available' | 'Occupied' | 'Full' | 'Locked' | 'Disabled' | 'Maintenance';

export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
}

export interface BinDto {
  id: string;
  binCode: string;
  status: BinStatus;
}

export interface ZoneDto {
  id: string;
  type: ZoneType;
  bins: BinDto[];
}

export interface BlockDto {
  id: string;
  code: string;
  zones: ZoneDto[];
}

export interface WarehouseHierarchyDto {
  warehouseId: string;
  code: string;
  name: string;
  blocks: BlockDto[];
}
```

---

## 5. Cấu Trúc File Frontend Đề Xuất (Next.js)

### Routes (`app/`)
- `app/(dashboard)/wms/layout/page.tsx`: Màn hình liệt kê danh sách các Kho (Warehouse List).
- `app/(dashboard)/wms/layout/[id]/page.tsx`: Màn hình cấu trúc kho (Hierarchy Tree) của một kho cụ thể.

### Components (`components/wms/layout/`)
- `WarehouseCard.tsx`: Card hiển thị thông tin tóm tắt của một kho (Tên, Mã).
- `WarehouseFormDialog.tsx`: Modal tạo mới kho.
- `HierarchyTree.tsx`: Component đệ quy hoặc Accordion (`@radix-ui/react-accordion`) hiển thị cấu trúc Block -> Zone -> Bin.
- `AddBlockDialog.tsx`: Modal thêm Block.
- `AddZoneDialog.tsx`: Modal thêm Zone (Có dropdown chọn loại Zone).
- `AddBinDialog.tsx`: Modal thêm Bin.
- `BinStatusBadge.tsx`: Component hiển thị nhãn màu cho Bin (Xanh lá = Available, Vàng = Occupied, Đỏ = Full/Locked).
- `EditBinStatusDialog.tsx`: Modal cập nhật trạng thái Bin.

### Services (`lib/api/`)
- `wms-layout.ts`: Chứa các hàm fetch (`getWarehouses`, `getHierarchy`, `createWarehouse`, `createBlock`, `createZone`, `createBin`, `updateBinStatus`).
