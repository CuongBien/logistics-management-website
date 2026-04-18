# WMS API Documentation - Inbound & Outbound

Tài liệu này mô tả chi tiết về 2 luồng nghiệp vụ API cốt lõi vừa được triển khai trong Service Warehouse: **Inbound API (Nhập kho)** và **Outbound API (Phân loại / Xuất kho)**.

---

## 1. Nghiệp Vụ Nhập Kho (WMS Inbound API) & Quản Lý Tồn Kho

Luồng nhập kho trong hệ thống Logistics không đi theo hướng e-commerce thông thường (auto-reserve/trừ kho trực tiếp trên giỏ hàng) mà dựa vào **thao tác quét vật lý thực tế**.

### 1.1 Khởi tạo dữ liệu tồn kho (Create Inventory)
Để các tính năng kho có thể hoạt động, nhân viên kho cần tiến hành khai báo các SKU và thiết lập thông tin tồn dự kiến/khởi tạo ban đầu.

* **Endpoint:** `POST /api/inventory`
* **Controller:** `InventoryController`
* **Command Handler:** `CreateInventoryItemCommandHandler`
* **Flow hoạt động:**
  1. Client gửi một `CreateInventoryItemCommand` bao gồm `Sku` và `Quantity`.
  2. Hệ thống kiểm tra tính duy nhất của mã SKU trong cơ sở dữ liệu (`InventoryItems`).
  3. Nếu SKU đã tồn tại, trả về `Result<Guid>.Failure(DomainErrors.Inventory.SkuAlreadyExists)`.
  4. Nếu hợp lệ, khởi tạo một Entity `InventoryItem`, lưu vào Database qua DB Context và trả về `Id` mới sinh.

### 1.2 Lắng nghe sự kiện kiện hàng sắp tới (Order Created Notification)
Khi một đơn vận chuyển (Waybill) mới được khởi tạo ở hệ thống OMS/Ordering, Warehouse Service sẽ được thông báo ngay lập tức.

* **Event Consumer:** `OrderCreatedConsumer`
* **Logic xử lý:**
  * Lắng nghe sự kiện Message `OrderCreatedIntegrationEvent` qua MassTransit/RabbitMQ.
  * *Quyết định kiến trúc:* Thay vì **Reserve Stock** (Giữ kho/Trừ kho) tự động, hệ thống Warehouse ở đây đóng vai trò Logistics. Hệ thống chỉ tiến hành **Ghi logs** thông báo nội bộ (Awaiting physical pickup & inbound scan). 
  * Quá trình nhập kho vật lý (Inbound) chỉ dứt điểm khi có nhân viên kho sử dụng máy quét mã vạch quét mã thùng hàng thực tế chuyển trạng thái sang `MarkInWarehouse`.

> [!NOTE]
> **Hướng phát triển (Roadmap):** Ở phiên bản nâng cao, việc lắng nghe `OrderCreatedIntegrationEvent` có thể được tận dụng để tự động sinh ra các **InboundTask** dự kiến (Pending tasks) cho đội ngũ tài xế (Pickup driver) hiển thị trên Mobile App.

---

## 2. Nghiệp Vụ Phân Loại / Xuất Kho (WMS Outbound API)

Luồng nghiệp vụ này đáp ứng công việc ở **trung tâm phân loại (Hub/Warehouse)**. Khi kiện hàng đã yên vị trong kho (nằm ở một `Bin` cụ thể), nhân viên tiến hành quét mã để xuất hàng hoặc phân loại sang phương tiện luân chuyển tiếp theo.

### 2.1 API Phân Loại Đơn Hàng (Sort Order)

* **Endpoint:** `PUT /api/outbound/sort`
* **Controller:** `OutboundController`
* **Command Handler:** `SortOrderCommandHandler`
* **Input (Payload):**
  * `OrderId` (Guid): ID của đơn vận chuyển cần xuất.
  * `DestinationHubId` (Guid): Mã bưu cục/Kho đích đến kế tiếp.

* **Flow hoạt động:**
  1. **Tìm kiếm vị trí kiện hàng:** Quét bảng `Bins` trong Entity Framework để dò ra chính xác Ô kệ / Vị trí nào đang cất giữ kiện hàng này (`CurrentOrderId == request.OrderId`).
  2. **Trường hợp thất bại:** Nếu không thấy `Bin`, hệ thống ném ra `Result.Failure(Bin.NotFound)`.
  3. **Giải phóng không gian (Release Bin):** 
     Thực thi phương thức `bin.Release()` trong Entity Domain. Bước này vô cùng quan trọng để gỡ bỏ `OrderId` khỏi `Bin`, cập nhật vị trí trống (`IsEmpty = true`) để kệ này có thể đón lô hàng khác vào nằm.
  4. **Phát Event Xuất Kho Thành Công:** 
     Gửi sự kiện `ShipmentSortedIntegrationEvent(OrderId, DestinationHubId, Timestamp)` thông qua `_publishEndpoint.Publish`.
     > Nhờ sử dụng Transactional Outbox Pattern ở tầng hạ tầng, Event này chỉ thực sự tới tay RabbitMQ nếu thao tác lưu DB `Release Bin` ở hệ thống cục bộ (WMS) là thành công, tránh hoàn toàn sai lệch dữ liệu phân tán.

> [!IMPORTANT]  
> Luồng **Sort Order** hoạt động như một nút kích hoạt (Trigger) liên Domain. Khi sự kiện `ShipmentSortedIntegrationEvent` bắn ra, cỗ máy trạng thái (Saga State Machine) bên dịch vụ **Ordering** sẽ bắt được sự kiện này và tự động dịch chuyển trạng thái Waybill của đơn hàng từ `AtHub` sang `InTransit` (Đang luân chuyển).
