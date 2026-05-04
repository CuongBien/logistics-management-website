# Kiểm tra replay và idempotency trên Docker

Hướng dẫn này giúp **chứng minh** duplicate delivery không tạo **side-effect nghiệp vụ trùng** trên các luồng tích hợp chính, chỉ dùng **stack Docker** trong [deploy/docker/docker-compose.local.yml](../deploy/docker/docker-compose.local.yml).

**Không sửa code.** Bằng chứng: **log trên Seq + đếm bản ghi Postgres**.

---

## Điều kiện trước khi làm

1. Stack đã chạy: `docker compose -f deploy/docker/docker-compose.local.yml up -d --build`
2. Đã có **ít nhất một lần** chạy E2E Postman xong đến bước sort (xem [LMS_E2E_Collection.postman_collection.json](./postman/LMS_E2E_Collection.postman_collection.json)).
3. Ghi nhận `orderId` (GUID) từ biến collection Postman hoặc response.

Thay `<ORDER_ID>` bên dưới bằng GUID đó.

---

## A) Warehouse – `ShipmentSortedConsumer` (tiền tạo inbound receipt)

**Consumer:** [ShipmentSortedConsumer.cs](../src/Services/Warehouse/Warehouse.Application/Features/Inbound/Consumers/ShipmentSortedConsumer.cs)  
**Kỳ vọng khi trùng message:** có log kiểu `Inbound receipt already exists ... Skip duplicate pre-create` và **không** có dòng thứ hai trong `inbound_receipts`.

### Vì sao chọn scenario này

`SortOrderCommandHandler` mỗi lần sort thành công đều publish `ShipmentSortedIntegrationEvent`. Gọi **sort hai lần** với cùng đơn (sau khi lần đầu đã tạo/khớp receipt) tương đương kích hoạt **lần xử lý thứ hai** cùng kịch bản.

### Bước thực hiện

1. Hoàn thành E2E đến **STEP 3** (sort) một lần.
2. Baseline đếm (DB WMS `lms_wms_dev`):

```bash
docker exec lms-postgres psql -U postgres -d lms_wms_dev -c 'SELECT COUNT(*) FROM "InboundReceipts" WHERE "OrderId" = '"'"'<ORDER_ID>'"'"';'
```

3. Chạy lại **STEP 3 sort** với **cùng** `orderId` (payload Postman như lần sort đầu).

4. Chạy lại câu `COUNT` tương tự.

**Tiêu chí PASS**

- `COUNT` vẫn là **1** (hoặc 0 chỉ khi luồng của bạn không hề tạo receipt; khi đó vẫn kỳ vọng chỉ có log skip mà không tăng bản ghi lạ).
- Trên Seq (Warehouse API) có log `Skip duplicate pre-create` với đúng `OrderId`.

---

## B) Ordering – `OrderStatusChangedConsumer` (đồng bộ sau ShipmentSorted)

**Consumer:** [OrderStatusChangedConsumer.cs](../src/Services/Ordering/Ordering.Application/Features/Notifications/Consumers/OrderStatusChangedConsumer.cs)  
**Kỳ vọng khi duplicate:** đơn đã `AwaitingDispatch` thì log `Skip ShipmentSorted sync for Order ...` và **không** thêm các dòng `order_status_histories` sai (transition không hợp lệ).

### Vì sao

Sau sort thành công lần đầu, đơn OMS đã **AwaitingDispatch**. Một `ShipmentSortedIntegrationEvent` thừa **không được** áp `MarkSorted` lần nữa.

### Bước thực hiện

1. Sau **lần sort thứ hai** của mục A, baseline số lịch sử (DB OMS `lms_oms_dev`):

```bash
docker exec lms-postgres psql -U postgres -d lms_oms_dev -c 'SELECT COUNT(*) FROM "OrderStatusHistories" WHERE "OrderId" = '"'"'<ORDER_ID>'"'"';'
```

2. (Tuỳ chọn) Liệt kê các dòng gần nhất:

```bash
docker exec lms-postgres psql -U postgres -d lms_oms_dev -c 'SELECT "StatusFrom", "StatusTo", "ChangedAtUtc", "Source" FROM "OrderStatusHistories" WHERE "OrderId" = '"'"'<ORDER_ID>'"'"' ORDER BY "ChangedAtUtc" DESC LIMIT 8;'
```

3. Chạy **STEP 3 sort lần thứ ba** (cùng body).

4. So sánh `COUNT(*)` một lần nữa.

**Tiêu chí PASS**

- `COUNT(*)` **không tăng** theo kiểu thêm một transition không đúng luật (số giống như sau lần sort thứ hai, trừ khi chỗ khác trong hệ có thêm transition hợp lệ).
- Nếu API sort trả `400` cho lần gọi lặp (đơn đã ở trạng thái không cho sort lại), vẫn được coi là PASS nếu count không tăng và không sinh side-effect mới.
- Seq (Ordering API) có log `Skip ShipmentSorted sync` với đúng `OrderId`.

---

## C) Warehouse – `OrderCreatedConsumer` (chỉ log)

**Consumer:** [OrderCreatedConsumer.cs](../src/Services/Warehouse/Warehouse.Application/Features/Inventory/Consumers/OrderCreatedConsumer.cs)  
**Hành vi:** chỉ ghi log, **không** ghi DB.

### Vì sao

`OrderCreatedIntegrationEvent` gửi trùng chỉ được phép làm **nhân đôi dòng log**, không được nhân đôi entity.

### Bước thực hiện

1. Tạo đơn mới (Postman STEP 1), ghi `orderId`.
2. Không có yêu cầu có dòng trong WMS DB cho consumer này. PASS nếu bạn tái publish hai lần trongSeq thấy **hai** dòng log `WMS: Received notification` (tuỳ chọn republic từ RabbitMQ nếu biết đúng queue — không bắt buộc cho MVP).

---

## D) Tuỳ chọn – RabbitMQ Management UI republic

**Khi nào dùng:** cần **cùng payload** được xử lý lại nhưng không muốn gọi lại HTTP.

1. Mở `http://localhost:15672` (user `lms`, mật khẩu `lms123`).
2. Tìm queue của consumer MassTransit phù hợp với event cần thử (tên thường kebab-case).
3. Dùng **Get messages** — **đừng purge nhẹ tay** trên môi trường dùng chung như staging thật.

**Cảnh báo:** chọn sai queue hoặc purge sai làm hỏng dữ liệu dev — ưu tiên **double-sort** qua HTTP ở mục A/B trước.

---

## E) Kiểm tra parity B1 (`order_consignees`)

Sau khi tạo đơn qua OMS, dual-write chỉ được **một** dòng `order_consignees` / đơn:

```bash
docker exec lms-postgres psql -U postgres -d lms_oms_dev -c 'SELECT COUNT(*) FROM "OrderConsignees" WHERE "OrderId" = '"'"'<ORDER_ID>'"'"';'
```

**Tiêu chí PASS:** với đơn tạo bằng luồng create chuẩn, luôn `COUNT(*) = 1`.

---

## Khi FAILED (quy trình báo regression)

Nếu bất kỳ count nào **tăng khi không được phép**:

1. Sao chép bộ lọc Seq + khung giờ.
2. Ghi nhận kết quả `COUNT` trước / sau.

3. Mở issue kèm bằng chứng đó và coi như regression so với tiêu chí chấp nhận Phase C1.
