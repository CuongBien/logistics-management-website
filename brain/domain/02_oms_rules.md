# Domain: OMS (Order Management System) Rules

## 1. Order Lifecycle (State Machine)

Trạng thái đơn hàng (`OrderStatus`) là dữ liệu quan trọng nhất. KHÔNG ĐƯỢC phép nhảy cóc trạng thái.

- **New:** Đơn vừa được tạo, chưa thanh toán/chưa xác nhận.
- **Confirmed:** Đã qua bước Fraud Check và Payment Successful.
- **Allocated:** Đã trừ tồn kho tạm thời (Soft Reserve) thành công bên WMS.
- **PickPack:** Đang xử lý tại kho (đã gửi lệnh sang WMS).
- **Handover:** Đã bàn giao cho đơn vị vận chuyển (3PL/Internal Fleet).
- **Delivering:** Đang trên đường đi.
- **Completed:** Giao thành công & đối soát COD xong.
- **Cancelled:** Hủy đơn (chỉ được hủy trước trạng thái `Handover`).

## 2. Business Rules (Invariants)

- **BR-OMS-01 (Inventory Check):** Không bao giờ được phép `Confirmed` đơn hàng nếu chưa check tồn kho (tránh Overselling). Với đơn hàng Flash Sale, bắt buộc dùng lua scripts trên Redis để trừ tồn kho.
- **BR-OMS-02 (Price Locking):** Giá sản phẩm trên đơn hàng là **giá tại thời điểm đặt** (`Snapshot Price`). Nếu sau đó admin sửa giá sản phẩm gốc, giá trên đơn cũ KHÔNG được thay đổi.
- **BR-OMS-03 (Cancellation):**
  - Khách chỉ được nút Hủy khi đơn ở trạng thái `New` hoặc `Confirmed`.
  - Nếu đơn đã sang `Allocated` hoặc `PickPack`, hệ thống phải gửi lệnh "Request Cancel" sang WMS. Chỉ khi WMS trả lời "OK" (chưa đóng gói), OMS mới được hủy.
- **BR-OMS-04 (Split Order Logic):**
  Một Order có thể bị split thành nhiều Shipments nếu:
  - Items nằm ở nhiều warehouses khác nhau
  - Một số items out of stock tạm thời

  **Rules:**
  - Mỗi Shipment phải có tracking code riêng
  - Phí ship được tính lại cho mỗi Shipment
  - Customer nhận notification cho TỪNG shipment
  - Order chỉ chuyển sang `Completed` khi TẤT CẢ shipments đã delivered

- **BR-OMS-05 (Fraud Check Rules):**
  Đơn hàng phải qua Fraud Scoring trước khi chuyển sang `Confirmed`:

  **Red Flags (Auto-reject):**
  - Địa chỉ IP có history scam
  - SĐT nằm trong blacklist
  - Đơn hàng > 50M nhưng COD (không chuyển khoản trước)

  **Yellow Flags (Manual Review):**
  - Khách hàng mới đặt đơn > 10M lần đầu
  - Địa chỉ giao khác tỉnh với SĐT đăng ký
  - Đặt hàng ngoài giờ (2AM - 5AM) với giá trị cao

## 3. Validation Rules

- **Input:** `CustomerId` bắt buộc. `ShippingAddress` phải có đủ 3 cấp (Tỉnh, Huyện, Xã).
- **Items:** List `OrderItems` không được rỗng. `Quantity` > 0.

## 4. Smart Routing Logic (Allocation Strategy)

Khi có đơn hàng, hệ thống chọn kho (Warehouse) theo thứ tự ưu tiên:

1.  **Distance:** Kho gần địa chỉ giao nhất (tính theo Haversine Formula).
2.  **Availability:** Kho có đủ số lượng hàng yêu cầu.
3.  **Capacity:** Kho chưa bị quá tải (Order Load < Max Load).
