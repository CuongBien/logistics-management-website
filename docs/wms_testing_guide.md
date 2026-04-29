# Hướng Dẫn Kiểm Thử (Testing Guide) - WMS Inbound & Outbound

Tài liệu này cung cấp các bước chi tiết để kiểm thử luồng Inbound (Nhập kho) và Outbound (Xuất kho) cho Warehouse Service tích hợp cùng hệ thống Logistics bằng Docker Compose, Postman (hoặc cURL), và hệ thống Tracking/Logging (Seq, RabbitMQ).

---

## 1. Chuẩn Bị Môi Trường

Đảm bảo rằng toàn bộ hệ thống được chạy lên ổn định và sử dụng source code mới nhất.

### 1.1 Khởi động Docker Compose
Biên dịch lại toàn bộ image mới nhất (nếu có bản cập nhật) và khởi chạy:
```bash
# Di chuyển tới thư mục chứa file docker-compose
cd d:\Logistics\deploy\docker

# Build lại các bản cập nhật mới nhất cho api
docker compose -f docker-compose.local.yml build

# Khởi động toàn bộ cụm Services (Database, RabbitMQ, Seq, APIs)
docker compose -f docker-compose.local.yml up -d
```

### 1.2 Danh sách Điểm Truy Cập (Endpoints & Dashboards)
Khi hệ thống chạy thành công, bạn có thể truy cập các dịch vụ sau thông qua trình duyệt:

| Dịch vụ             | Cổng local     | URL Kiểm tra nhanh (Swagger / UI) |
|---------------------|----------------|-----------------------------------|
| **Warehouse API**   | `5051`         | `http://localhost:5051/swagger` *(Trực tiếp)* |
| **Ordering API**    | `5000`         | `http://localhost:5000/swagger` *(Trực tiếp)* |
| **API Gateway BFF** | `8000`         | **👉 Dùng cổng này để Test:** <br>- Warehouse: `http://localhost:8000/swagger/wms/index.html`<br>- Ordering: `http://localhost:8000/swagger/oms/index.html` |
| **Seq (Logs)**      | `8081`         | `http://localhost:8081`           |
| **RabbitMQ**        | `15672`        | `http://localhost:15672` (User/Pass: `lms`/`lms123`) |
| **Keycloak**        | `18080`        | `http://localhost:18080`          |

---

## 2. Kịch Bản Kiểm Thử: Nhập Kho (Inbound)

Luồng kiểm thử yêu cầu chúng ta tạo mới thông tin cấu hình sản phẩm trong kho thông qua REST API chuyên dụng.

### Kịch bản: Khai báo tồn kho ban đầu (Create Inventory Item)
Để kho có thể chứa hàng, trước tiên cần khai báo mã SKU và Số lượng hàng dự kiến nhập.

✅ **API Truy cập (Khuyên dùng qua BFF):** `POST http://localhost:8000/api/warehouse/api/Inventory`  
*(Hoặc cổng trực tiếp `POST http://localhost:5051/api/Inventory`).*

✅ **Payload (JSON):**
```json
{
  "sku": "IPHONE-15-PRM-256-BLK",
  "quantity": 100
}
```

✅ **Kết quả mong đợi:**
* HTTP Status `200 OK`.
* Body trả về một chuỗi `Guid` (đại diện cho `InventoryItemId` mới được sinh ra).
* *Kiểm tra thêm:* Gửi lại cùng một Payload đó lần thứ 2, hệ thống phải trả về lỗi (Ví dụ: `400 Bad Request` hoặc `Validation Error`) báo rằng "SKU này đã tồn tại".

---

## 3. Kịch Bản Kiểm Thử: Phân Loại / Xuất Kho (Outbound) - Luồng End-to-End

Đóng vai một nhân viên Hub nhận được yêu cầu chuyển kiện hàng từ kệ xuống xe tải thông qua Terminal/Máy quét. Để bài Test diễn ra thành công từ A->Z (cập nhật chéo State Machine), bạn CẦN sử dụng một `OrderId` **cấp phát thực tế** từ hệ thống Order, thay vì gõ random 1 đoạn GUID ảo.

### Bước 3.1: Tạo mới một Order thật (Ordering API)
- **Truy cập:** `POST http://localhost:8000/api/ordering/api/Orders`
- **Payload:** Truyền Payload mẫu JSON lên để tạo đơn.
- **Lấy OrderId:** Sau khi gửi đi, API sẽ trả về Status 200 OK cùng 1 chuỗi GUID (Đây là mã `OrderId` thật, ví dụ: `d8b5a...`). Đơn hàng này sẽ tự động sinh dữ liệu trong db `lms_oms_dev` (bảng `OrderStates`).

### Bước 3.2: Fake vị trí kiện hàng trong Kho
Vì chúng ta chưa làm API gỡ hàng (Put-away), bạn cần dùng lệnh SQL để "đặt" kiện hàng vừa tạo lên kệ `BIN-A1-01`.
- **Mở Terminal chạy lệnh (thay thế ID của bạn vào):**
  ```bash
  # Cú pháp: UPDATE "Bins" SET "CurrentOrderId" = '<ĐIỀN_ORDER_ID_THẬT>' WHERE "Id" = '44444444-4444-4444-4444-444444444444';
  docker exec -it lms-postgres psql -U postgres -d lms_wms_dev -c "UPDATE \"Bins\" SET \"CurrentOrderId\" = 'd8b5a...' WHERE \"Id\" = '44444444-4444-4444-4444-444444444444';"
  ```

### Bước 3.3: Bắn API Phân Loại / Release Bin (Warehouse API)
Bây giờ dữ liệu đã khớp hoàn toàn, bạn đóng vai nhân viên kho quét kiện hàng đó để xuất kho:
✅ **API Truy cập (BFF):** `PUT http://localhost:8000/api/warehouse/api/outbound/sort`

✅ **Payload (JSON):**
```json
{
  "orderId": "<ĐIỀN_ORDER_ID_THẬT_CỦA_BẠN>",
  "destinationHubId": "48b030da-e7ad-452f-90db-ddb01a613583"
}
```

✅ **Kết quả mong đợi:**
* HTTP Status `200 OK`. Lệnh được xử lý thành công.
* Lập tức một Event `ShipmentSorted` được phát cho hệ thống Ordering xử lý gạch nợ/chuyển trạng thái.
* Nếu truyền một `orderId` chưa xuất hiện trong bảng Bins, API sẽ chặn lại trả `404 Not Found`.

---

## 4. Kiểm chứng dữ liệu luồng Event-Driven (Cực kì quan trọng)

Do Logistics sử dụng **RabbitMQ** kết hợp **MassTransit**, để chứng minh luồng Outbound/Inbound chạy thành công 100%, bạn cần giám sát theo thứ tự sau:

### Bước 4.1: Kiểm tra Log tập trung trên Seq
1. Mở Seq UI tại địa chỉ `http://localhost:8081`.
2. Tạo bộ lọc: `@Message like '%ShipmentSortedIntegrationEvent%'` hoặc lọc theo cụm `WMS: Received notification`.
3. Khi gọi API `Outbound/Sort` thành công, bạn sẽ thấy Logs ghi nhận tiến trình Outbox lưu Event vào DB và Message đã được phát đi.

### Bước 4.2: Giám sát Event trên RabbitMQ
1. Đăng nhập RabbitMQ UI `http://localhost:15672` (Tài khoản: `lms` / `lms123`).
2. Tab **Exchanges**: Bạn sẽ thấy các Exchange tên là `EventBus.Messages.Events:ShipmentSortedIntegrationEvent` được tạo tự động bởi MassTransit.
3. Nếu hệ thống Ordering có consumer (`ShipmentSortedConsumer` / `OrderFulfillmentStateMachine`), thông điệp sẽ được bắt và chuyển trạng thái Saga State từ `AtHub` sang `InTransit`.

### Bước 4.3: Kiểm định DB trạng thái chéo (Cross-Domain State)
1. Truy cập DB PostgreSQL ở `localhost:56432`.
2. Mở schema `lms_wms_dev` => Kiểm tra table `Bins`, cột `Status` phải chuyển thành `Available` và `CurrentOrderId` = `NULL`.
3. Mở schema `lms_oms_dev` => Kiểm tra table `OrderStates`, cột `CurrentState` của OrderId đó đã chuyển sang `InTransit` (Nhờ Saga update state).
