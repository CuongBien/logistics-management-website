# Báo Cáo Triển Khai IAM RBAC - Bước 1: Nền tảng Dữ Liệu (Data Foundation)

Tài liệu này ghi nhận lại toàn bộ thay đổi về Cấu trúc Dữ liệu (Database Schema) và các Domain Entities được thêm vào ở Bước 1 trong quá trình triển khai Hệ thống Phân quyền Lai (Hybrid RBAC).

## 1. Domain Entities Mới
Để phục vụ cho mô hình phân quyền chặt chẽ, 4 Entities cốt lõi đã được thêm vào tầng Domain (`Warehouse.Domain\Entities`):

- **Role**: Đại diện cho Vai trò (VD: Manager, Picker). Có `Code` duy nhất để dễ định danh.
- **Permission**: Đại diện cho các quyền hệ thống nhỏ nhất (VD: `inbound:receive`).
- **RolePermission**: Bảng trung gian giải quyết quan hệ Many-to-Many giữa Role và Permission.
- **OperatorRoleAssignment**: Bảng cấu hình trọng tâm. Gắn kết `OperatorId` + `RoleId` + `WarehouseId` + `ZoneId` (nếu có). Đi kèm thời hạn phân quyền `EffectiveFrom` - `EffectiveTo`.

## 2. Nâng Cấp OperatorProfile
Entity `OperatorProfile` đã được mở rộng thêm Navigation Property `RoleAssignments` để ánh xạ 1-N với cấu hình phân quyền ở trên.

## 3. EF Core Configurations & Ràng Buộc
Toàn bộ quy tắc CSDL được định nghĩa chặt chẽ trong `Warehouse.Infrastructure\Persistence\Configurations`:
- `Role.Code` và `Permission.Code` đều là UNIQUE INDEX.
- `OperatorRoleAssignment` có Composite Unique Index trên bộ Tứ `(OperatorProfileId, WarehouseId, RoleId, ZoneId)` để chống việc gán một quyền lặp lại nhiều lần cho cùng một nhân viên ở cùng một khu vực.
- Sử dụng `DeleteBehavior.Cascade` cho các bảng trung gian (khi xóa Role thì RolePermission tự xóa), nhưng dùng `DeleteBehavior.Restrict` khi trỏ về Warehouse/Zone để đảm bảo tính toàn vẹn Không gian.

## 4. Dữ Liệu Khởi Tạo (Seeding)
Hệ thống đã tự động chèn (Seed) 2 Permissions đầu tiên bằng `HasData` vào Database qua Migration:
- `inbound:receive` (Quyền thao tác nhận hàng).
- `inbound:force_close` (Quyền Manager ép đóng phiếu nhập hàng thiếu).

## 5. Tự Động Migrate (Auto-Migration)
Nhờ cấu hình `context.Database.Migrate()` trong `Program.cs`, Container `warehouse.api` đã tự động update Schema của PostgreSQL ngay khi khởi động. Không cần kỹ sư phải chạy script SQL bằng tay.

## 6. Hướng Dẫn Kiểm Tra (Verification)
Bạn có thể mở Terminal và chạy đoạn lệnh sau (đã xử lý escape quote cho PowerShell) để tận mắt xem 2 quyền khởi tạo đã nằm sẵn trong bảng `Permissions` hay chưa:

```powershell
docker exec lms-postgres psql -U postgres -d lms_wms_dev -c "SELECT * FROM public.\`"Permissions\`";"
```

**Kết quả kỳ vọng:**
```text
                  Id                  |        Code         | Resource |   Action    | IsActive 
--------------------------------------+---------------------+----------+-------------+----------
 00000000-0000-0000-0000-000000000001 | inbound:receive     | inbound  | receive     | t
 00000000-0000-0000-0000-000000000002 | inbound:force_close | inbound  | force_close | t
(2 rows)
```

---
**Trạng thái**: Hoàn tất 100%. Đã sẵn sàng cho Bước 2 (Xây dựng Policy Authorization Handler).
