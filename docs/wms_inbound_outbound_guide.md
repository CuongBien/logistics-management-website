# WMS Inbound & Outbound Architecture Guide

Tài liệu này đóng vai trò như một **Cheat Sheet** cho Sprint tiếp theo: Xây dựng luồng thực thi (API) cho nghiệp vụ **Inbound** (Nhập kho) và **Outbound** (Xuất kho) dựa trên kiến trúc Domain Modeling mới nhất vừa được chuẩn hoá.

---

## 1. Bản đồ Entities (Domain Model)

Hệ thống Warehouse hiện tại được tổ chức chia làm 2 cụm chính:

### Cụm Địa lý (Location/Topology)
Đóng vai trò định vị tọa độ và không gian vật lý trong không gian kho.
*   **`Warehouse` (Nhà kho):** Đơn vị root lớn nhất (ví dụ "Kho Hà Nội Cát Linh").
*   **`Block` (Khu/Toà):** Một kho có thể có nhiều Block (ví dụ "Block A dành cho đồ đông lạnh").
*   **`Zone` (Khu vực):** Chia nhỏ từ Block (ví dụ "Zone Nhập Hàng", "Zone Lưu Trữ Kệ Cao").
*   **`Bin` (Vị trí lưu trữ chi tiết):** Đơn vị nhỏ nhất để cất hàng hóa (ví dụ "Kệ A1 - Tầng 2 - Ô 3").
    *   *Lưu ý:* `Bin` chứa thuộc tính `Version` để đảm bảo **Optimistic Concurrency** phòng khi nhiều nhân viên cùng quét mã vào một ô kệ cùng lúc.

### Cụm Kiểm soát Hàng hoá (Inventory & Movement)
Đóng vai trò quản lý vòng đời biến động của sản phẩm.
*   **`InventoryItem` (Dòng tồn kho):** Đại diện cho 1 sản phẩm `Sku` duy nhất.
    *   `QuantityOnHand`: Tổng hàng đang có thực tế trong kho.
    *   `ReservedQty`: Hàng đã bị khóa (Dành cho các đơn hàng Outbound đang chờ pick).
    *   `AvailableQty`: (Computed) Hàng thực sự có thể mang bán (`QuantityOnHand - ReservedQty`).
    *   *Quản lý đồng thời:* Có thuộc tính `Version` chạy song song với `IsConcurrencyToken`, cực kì quan trọng khi xử lý API.

*   **`InboundReceipt` (Phiếu Nhập Kho):** Tài liệu quản lý nguyên 1 chuyến xe tải chở hàng tới.
    *   Có `InboundReceiptStatus` (New, Processing, Completed, Cancelled).
*   **`InboundItem` (Chi tiết Nhập Kho):** Thuộc về 1 phiếu nhập, ghi rõ Sku gì, bao nhiêu cái, và **được cất vào `Bin` nào** (`BinId`).

---

## 2. API Thiết kế cho Nhập Kho (Inbound Flow)

Nghiệp vụ nhập kho thực tế thường diễn ra qua 3 bước, bạn nên thiết kế 3 API (Commands) tách biệt thay vì gộp chung:

### API 1: Khởi tạo phiếu nhập (Create Inbound Receipt)
*   **Actor:** Nhân viên văn phòng / ERP system bắn dữ liệu sang.
*   **Logic:** Khởi tạo `InboundReceipt` mang trạng thái `New`. Data chỉ chứa danh sách SKU và số lượng *dự kiến* (Expected Quantity). Chưa hề đụng chạm tới Tồn kho (`InventoryItem`).

### API 2: Ghi nhận xe tới & dỡ hàng (Receive/Check-in Receipt)
*   **Actor:** Thủ kho ở cửa Inbound.
*   **Logic:** Đổi trạng thái `InboundReceipt` thành `Processing`. Kiểm đếm thực tế có trùng khớp với dự kiến hay không. Cập nhật ngày giờ `ReceivedAt`.

### API 3: Cất hàng lên kệ (Put-away Items) - Quan trọng nhất!
*   **Actor:** Nhân viên chạy xe nâng cầm máy quét mã (Barcode scanner).
*   **Logic:** 
    1. Update `BinId` vào trong từng dòng `InboundItem` (xác định chính xác món hàng này sẽ nằm ở ô nào).
    2. Cộng dồn vào `InventoryItem.QuantityOnHand`.
    3. Cập nhật `InventoryItem.LastRestockedAt` bằng thời gian hiện tại.
    4. Call hàm `inventoryItem.Restock(...)`. Nếu tổng phiếu xong hết, đổi trạng thái phiếu thành `Completed`.

> [!TIP]
> **Best Practice cho API Nhập Kho:**
> Ở hàm xử lý `Restock()`, hãy cẩn thận xử lý `DbUpdateConcurrencyException`. Mẹo là sử dụng Polly Retry Policy bên trong Application layer nếu có nhân viên khác đang thao tác trên cùng một dòng `InventoryItem`.

---

## 3. API Thiết kế cho Xuất Kho (Outbound Flow)

Vì chúng ta sử dụng **MassTransit + RabbitMQ**, xuất kho thường được trigger hoàn toàn bởi Event thay vì Rest API thông thường. Flow tích hợp với `Ordering` qua các Message handlers như sau:

### Phase 1: Giữ chỗ (Reservation)
*   **Trigger by:** `ReserveStockHandler` lắng nghe `OrderCreatedEvent` hoặc Call trực tiếp từ Ordering Saga.
*   **Logic:** 
    1. Kiểm tra tồn `AvailableQty >= OrderQty`. Nếu thỏa mãn, gọi hàm `ReserveStock(OrderQty)`.
    2. Hàm này tăng `ReservedQty` lên.
    3. Gửi Event `StockReservedEvent` (Saga chuyển sang trạng thái chờ đóng gói).
    4. Nếu không đủ tồn, ném Exeception thủng kho -> Bắn sự kiện `StockReservationFailedEvent` (Saga sẽ hủy Order).

### Phase 2: Đi nhặt hàng (Picking)
*   Có thể làm thông qua App điều hành của Warehouse. Nhân viên kho nhìn màn hình và đi nhặt đồ ra khỏi `Bin`.
*   *(Chưa có Entity:* Cân nhắc tạo Entity `OutboundOrder` hoặc `PickingList` trong tương lai gần*)*.

### Phase 3: Rời kho (Dispatch/Deduction)
*   **Trigger by:** Bấm nút "Confirm Shipment" từ nhân viên đóng gói.
*   **Logic:** 
    1. Gọi hàm `inventoryItem.Deduct(quantity)`.
    2. Lúc này ta trừ đi ở biến `QuantityOnHand`, song song trừ đi ở biến `ReservedQty` (vì mình đã lấy hàng vật lý đi và thả giải phóng trạng thái khóa).
    3. Bắn event `OrderDispatchedEvent` ra ngoài thềm cho thằng Logistic giao hàng.

---

## 4. Các điểm cần cân nhắc (Roadmap sắp tới)

1. **Tracking Bin/SKU Details:**
   Hiện tại `InventoryItem` mang tính vĩ mô (tính tổng số lượng của công ty). 
   Nếu muốn biết *chính xác* 50 cái iPhone nằm ở `Bin-A` và 20 cái iPhone nằm ở `Bin-B`, chúng ta sẽ cần phải thiết kế thêm entity **`BinInventory` (hoặc `StockLocator`)** nối giữa `Bin` và `Sku` thay vì chỉ lưu `InventoryItem` chung chung. Bạn hãy cân nhắc điều này dựa vào độ phức tạp của dự án.
   
2. **Domain Events:**
   Ở Entities `InventoryItem` và `InboundReceipt`, khi chúng ta đổi trạng thái, nhớ implement `entity.AddDomainEvent(new InventoryRestockedEvent(...))` bên dưới tầng Base Entity `Logistics.Core.Entity` để kích hoạt Notification trong hệ thống nội bộ, cập nhật log hoặc báo cho signalR dashboard.

3. **CQRS Views:**
   Các màn hình dashboard liệt kê tồn kho nên đọc từ Dapper trực tiếp (Queries) vì EF Core đôi lúc load `Include(Block -> Zone -> Bin)` khá cồng kềnh với dữ liệu nhà kho siêu lớn.
