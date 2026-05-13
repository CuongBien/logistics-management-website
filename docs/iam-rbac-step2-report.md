# Báo Cáo Triển Khai IAM RBAC - Bước 2: Tầng Xác Thực & Caching

Tài liệu này ghi nhận chi tiết các thành phần logic và cơ chế bảo mật đã được thiết lập trong Bước 2, tập trung vào việc kiểm tra quyền hạn theo phạm vi không gian (Spatial Scoping) và tự động cấp hồ sơ nhân viên (JIT Provisioning).

## 1. Cơ Chế JIT Provisioning (OperatorProvisioningMiddleware)
Để tối ưu luồng trải nghiệm, chúng ta đã triển khai một Middleware tùy chỉnh:
- **Nhiệm vụ**: Tự động tạo bản ghi `OperatorProfile` trong cơ sở dữ liệu WMS ngay khi người dùng đăng nhập thành công từ Keycloak lần đầu tiên.
- **Logic**: Middleware trích xuất mã định danh `sub` và `tenantId` từ JWT Token. Nếu chưa có profile tương ứng, nó sẽ tự động khởi tạo với tên hiển thị từ Token.
- **Hiệu năng**: Sử dụng `IMemoryCache` để ghi nhớ các user đã được provisioned, tránh việc check database ở mọi Request.

## 2. Dịch Vụ Kiểm Tra Quyền Hạn (OperatorAuthorizationService)
Đây là thành phần cốt lõi thực thi mô hình RBAC mới:
- **Spatial Scoping**: Khác với phân quyền thông thường, dịch vụ này hỗ trợ kiểm tra quyền dựa trên cấp độ:
    - **Toàn kho**: Nếu `ZoneId` trong bảng gán quyền là NULL.
    - **Khu vực cụ thể**: Nếu `ZoneId` được chỉ định rõ ràng.
- **Caching**: Danh sách quyền của nhân viên được cache trong **5 phút**. Khi Admin thay đổi Role/Permission trong DB, quyền mới sẽ có hiệu lực sau tối đa 5 phút hoặc khi Cache hết hạn.

## 3. Tích Hợp Vào Nghiệp Vụ (Command Handlers)
Chúng ta đã chuyển đổi từ cơ chế kiểm tra "có quyền vào kho không" sang "có quyền thực hiện hành động X tại vị trí Y không":

- **Receive Inbound Item**: Khi nhân viên quét mã Bin, hệ thống sẽ lấy `WarehouseId` và `ZoneId` từ Bin đó, sau đó gọi `HasPermissionAsync` để kiểm tra quyền `inbound:receive`.
- **Force Close Receipt**: Kiểm tra quyền `inbound:force_close` dựa trên `WarehouseId` của phiếu nhập hàng.

## 4. Các Thành Phần Code Chính
- `IOperatorAuthorizationService`: Interface định nghĩa logic check quyền.
- `OperatorAuthorizationService`: Thực thi logic check quyền + tích hợp MemoryCache.
- `OperatorProvisioningMiddleware`: Xử lý tự động tạo hồ sơ nhân viên.
- `Program.cs` & `DependencyInjection.cs`: Đăng ký dịch vụ và cấu hình pipeline.

---
**Kết quả**: Hệ thống đã sẵn sàng để vận hành với mức độ bảo mật cao nhất, cho phép phân quyền chi tiết đến từng dãy kệ (Zone) trong kho.

**Trạng thái**: Hoàn tất 100%. Sẵn sàng cho Bước 3 (Cleanup & Refactoring).
