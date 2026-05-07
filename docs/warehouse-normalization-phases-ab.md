# Warehouse Normalization: Pha A & B (Layout & Inbound)

Tài liệu này tổng hợp chi tiết toàn bộ kiến trúc, logic nghiệp vụ, và các refactoring đã được triển khai thành công trong hệ thống Warehouse Microservice (từ lúc bắt đầu chuẩn hóa đến khi hoàn tất Inbound Decomposition).

---

## 1. Bối Cảnh (Context)
Hệ thống Warehouse ban đầu được thiết kế theo dạng *Flat Model* (lưu trữ đơn giản) để phục vụ cho MVP. Tuy nhiên, để đáp ứng quy mô Enterprise thực tế với Multi-Warehouse, Multi-Tenant và xử lý hàng tồn kho phức tạp, chúng ta đã tiến hành chuẩn hóa toàn diện (Normalization W2).

Hai pha đầu tiên đã hoàn thành:
- **Phase A**: Chuẩn hóa Layout Không gian kho (Spatial Layout).
- **Phase B**: Chuẩn hóa Quy trình Nhập kho (Inbound Process) từ dạng nguyên khối sang Header-Line-Allocation.

---

## 2. Phase A: Layout Normalization (Chuẩn hóa Không gian)

### 2.1 Kiến trúc mới
Thay vì lưu chung chung, cấu trúc kho được phân cấp rõ ràng 4 mức độ:
1. **Warehouse** (Tòa nhà / Chi nhánh kho).
2. **Block** (Khu vực lớn, ví dụ: Khu A, Khu Nhiệt độ thấp).
3. **Zone** (Dãy kệ, ví dụ: Dãy A1, A2). Định nghĩa kiểu lưu trữ (`ZoneType`: Picking, Overstock, Bulk).
4. **Bin** (Vị trí chính xác trên kệ, ví dụ: BIN-A1-01). Mỗi Bin có `BinStatus` riêng (Active, Inactive, Full).

### 2.2 Các Ràng buộc (Constraints)
- Một `Bin` bắt buộc phải thuộc một `Zone`.
- Một `Zone` bắt buộc phải thuộc một `Block`.
- Một `Block` bắt buộc phải thuộc một `Warehouse`.
- **Validation**: Đã thiết lập EF Core Rules không cho phép xóa `Zone` nếu bên trong vẫn còn `Bin` (Restricted Delete).

---

## 3. Phase B: Inbound Normalization (Chuẩn hóa Luồng Nhập)

Đây là đợt refactor cốt lõi nhằm biến Inbound từ "nhận phát xong luôn" thành quy trình nhận hàng từng phần (Partial Receiving) và định danh vị trí lưu trữ thực tế.

### 3.1 Mô hình dữ liệu Header-Line-Allocation
Đã tách `InboundReceipt` thành 3 bảng chi tiết:
1. **InboundReceipts (Header)**: Thông tin tổng quan của đợt nhập hàng, liên kết với `OrderId`, có `SourceShipmentNo`.
2. **InboundReceiptLines (Detail)**: Liệt kê chi tiết từng mã `Sku`, ghi nhận số lượng kỳ vọng (`ExpectedQuantity`) và số lượng đã nhận (`ReceivedQuantity`).
3. **InboundBinAllocations (Putaway)**: Theo dõi xem số lượng thực tế nhận được đã cất vào `Bin` nào.
   - *Logic đặc biệt*: Chống vi phạm `UNIQUE Constraint` khi nhận hàng nhiều lần vào cùng một Bin. Lệnh `AddQuantity()` được triển khai để tự động cộng dồn (Aggregate) số lượng thay vì tạo bản ghi rác.

### 3.2 Dynamic Status Recalculation (Trạng thái Động)
Entity `InboundReceipt` tự động thay đổi trạng thái dựa trên hành động quét hàng:
- **Pending**: Mới tạo ASN, chưa nhận món nào.
- **PartiallyReceived**: Đã nhận ít nhất 1 món, nhưng chưa đủ tổng `ExpectedQuantity` của toàn bộ các dòng.
- **Received**: Đã nhận đủ 100% tất cả các mặt hàng.

### 3.3 Tối ưu Idempotency & Message Broker (MassTransit)
- **Vấn đề cũ**: Khi một đơn hàng (Order) bị tách thành nhiều Shipment (Split Shipment), hệ thống WMS bị lỗi `Duplicate OrderId` do chốt cứng Idempotency theo `OrderId`.
- **Giải pháp**: 
  - Thay đổi Idempotency Key của lệnh tạo phiếu nhập (ASN) thành: `SourceShipmentNo` + `WarehouseId` + `TenantId`.
  - Nhờ đó, một `OrderId` có thể tạo ra nhiều Phiếu Nhập khác nhau, giúp quy trình lấy/giao hàng chia nhỏ hoạt động trơn tru.

### 3.4 Integration Event Gates (Cổng sự kiện)
Sự kiện `ShipmentReceivedIntegrationEvent` (châm ngòi cho Outbound Process của Hub khác) **CHỈ ĐƯỢC BẮN RA** khi phiếu nhập đạt trạng thái `Received` hoặc `CompletedWithExceptions`. Điều này ngăn chặn việc OMS xử lý sai khi hàng mới về được một nửa.

---

## 4. Xử lý Ngoại lệ (Exceptions Handling)

### Force Close API (Chốt sổ cưỡng chế)
- **Tình huống thực tế**: Nhà cung cấp (Supplier) giao thiếu hàng (Short Shipment). Hệ thống tự động treo ở trạng thái `PartiallyReceived`.
- **Giải pháp đã làm**: Tạo API `POST /api/inbound/receipts/{id}/force-close`.
  - Cho phép người quản lý kho chủ động đóng phiếu.
  - Chuyển `InboundReceiptStatus` sang trạng thái mới `CompletedWithExceptions`.
  - Bắn Integration Event để hệ thống bên ngoài biết và tiến hành hoàn tiền / cấn trừ đối soát mà không bị kẹt vĩnh viễn.

---

## 5. Security & Authorization (Xác thực và Phân quyền)

### JWT Scopes & Operator Validation
- Tích hợp kiểm tra Authorization chéo trong Command Handler.
- Khi một nhân viên (`operatorSub`) thực hiện hành động nhận hàng, hệ thống tự động dò `OperatorProfiles` và `OperatorWarehouseScopes` để đảm bảo: **Nhân viên này có quyền thao tác trên Warehouse mà cái Bin đó đang thuộc về không?**
- Bắn lỗi HTTP 403 Forbidden chuẩn mực nếu phát hiện truy cập trái thẩm quyền.

---

## 6. Codebase Refactoring

- **Global JSON Config**: Thêm cấu hình `ReferenceHandler.IgnoreCycles` trong `Program.cs` để giải quyết dứt điểm lỗi HTTP 500 Object Cycle khi Serialize các EF Core Entities lồng nhau.
- **Enum Centralization**: Toàn bộ các định nghĩa Enum bị rải rác trong Entities (`InboundReceiptStatus`, `PutawayStatus`, `ShipmentStatus`, `DestinationType`, `OutboundOrderStatus`) đã được bóc tách và gom gọn vào thư mục chuẩn `Warehouse.Domain.Enums`, giúp codebase sạch sẽ, dễ bảo trì và dễ mapping.

---
*Status: Phase A & Phase B đã hoàn tất 100%. Sẵn sàng chuyển sang Phase C (Outbound Decomposition).*
