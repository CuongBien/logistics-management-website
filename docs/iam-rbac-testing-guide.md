# Hướng Dẫn Kiểm Tra Chi Tiết Hệ Thống IAM RBAC

Tài liệu này hướng dẫn bạn cách kiểm tra từng thành phần của hệ thống phân quyền mới để đảm bảo mọi thứ vận hành đúng như thiết kế.

## 1. Kiểm tra Database & Seed Data
Kiểm tra xem các bảng đã được tạo đúng và dữ liệu mẫu (Permissions) đã có sẵn chưa.

**Lệnh chạy (PowerShell):**
```powershell
# Kiểm tra danh sách quyền (Phải có 3 dòng: receive, force_close, sort)
docker exec lms-postgres psql -U postgres -d lms_wms_dev -c "SELECT * FROM public.\`"Permissions\`";"

# Kiểm tra bảng gán quyền (Lúc đầu sẽ trống)
docker exec lms-postgres psql -U postgres -d lms_wms_dev -c "SELECT * FROM public.\`"OperatorRoleAssignments\`";"
```

---

## 2. Kiểm tra JIT Provisioning (Middleware)
Kiểm tra xem hệ thống có tự tạo Profile khi bạn gửi request không.

**Các bước:**
1. Dùng Postman hoặc Script Python gửi 1 request bất kỳ kèm JWT Token (VD: Get Health hoặc Get Inbound).
2. Kiểm tra bảng `OperatorProfiles`:
```powershell
docker exec lms-postgres psql -U postgres -d lms_wms_dev -c "SELECT * FROM public.\`"operator_profiles\`";"
```
**Kết quả kỳ vọng**: Bạn sẽ thấy một dòng mới được tạo với `OperatorSub` trùng với `sub` trong Token của bạn.

---

## 3. Kiểm tra Chặn Quyền (Forbidden - 403)
Khi chưa được gán Role, bạn sẽ bị chặn.

**Các bước:**
1. Gửi request `PUT /api/inbound/receipts/{id}/receive`.
2. **Kết quả kỳ vọng**: Nhận về lỗi `403 Forbidden` với thông báo: *"Operator '...' does not have permission 'inbound:receive'..."*

---

## 4. Kiểm tra Cấp Quyền & Caching (Allowed - 200)
Thử nghiệm gán quyền và kiểm tra tính hiệu lực.

**Các bước:**
1. **Tạo Role & Gán Quyền**: Chạy các lệnh SQL sau vào DB (có thể dùng DBeaver hoặc docker exec):
```sql
-- 1. Tạo Role 'Manager'
INSERT INTO public."Roles" ("Id", "Code", "Name", "IsActive") 
VALUES (gen_random_uuid(), 'manager', 'Warehouse Manager', true);

-- 2. Gán quyền 'inbound:receive' cho Role 'manager'
-- (Lấy Id của Permission 'inbound:receive' từ bước 1)
INSERT INTO public."RolePermissions" ("RoleId", "PermissionId")
SELECT r."Id", p."Id" 
FROM public."Roles" r, public."Permissions" p 
WHERE r."Code" = 'manager' AND p."Code" = 'inbound:receive';

-- 3. Gán Role 'manager' cho Operator của bạn tại Warehouse X
-- (Thay thế 'YOUR_OPERATOR_ID' và 'YOUR_WAREHOUSE_ID')
INSERT INTO public."OperatorRoleAssignments" ("Id", "OperatorProfileId", "RoleId", "WarehouseId", "Status")
SELECT gen_random_uuid(), o."Id", r."Id", 'ID_KHO_CUA_BAN', 0
FROM public."operator_profiles" o, public."Roles" r
WHERE o."OperatorSub" = 'SUB_CUA_BAN' AND r."Code" = 'manager';
```

2. **Gửi lại request `Receive`**:
   - Lần đầu có thể vẫn bị 403 do **Cache (5 phút)**.
   - Bạn có thể đợi 5 phút hoặc **Restart container** để xóa cache.
   - **Kết quả kỳ vọng**: Trả về `200 OK`.

---

## 5. Kiểm tra Spatial Scoping (Phạm vi không gian)
Đây là phần quan trọng nhất.

**Kịch bản:**
1. Gán quyền cho nhân viên tại **Warehouse A**.
2. Thử thực hiện `Receive` vào một Bin thuộc **Warehouse B**.
3. **Kết quả kỳ vọng**: Phải bị **403 Forbidden** vì nhân viên đó chỉ có quyền tại Kho A.

---

## 6. Kiểm tra Cleanup (Dọn dẹp)
Đảm bảo bảng cũ đã biến mất.

**Lệnh chạy:**
```powershell
docker exec lms-postgres psql -U postgres -d lms_wms_dev -c "\dt public.\`"OperatorWarehouseScopes\`""
```
**Kết quả kỳ vọng**: Thông báo `Did not find any relation named "public.OperatorWarehouseScopes"`.
