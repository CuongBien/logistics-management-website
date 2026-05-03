# Runbook vận hành LMS môi trường local (Docker)

Tài liệu tham khảo ngắn để **xử lý sự cố** khi stack chạy từ [deploy/docker/docker-compose.local.yml](../deploy/docker/docker-compose.local.yml) (kiểu local / staging-lite).

---

## 1) Tổng quan stack (cổng trên máy host)

| Dịch vụ | Container | URL / cổng trên host | Ghi chú |
|---------|-----------|----------------------|---------|
| Postgres (OMS + WMS) | `lms-postgres` | `localhost:56432` | DB: `lms_oms_dev`, `lms_wms_dev` |
| RabbitMQ + UI quản trị | `lms-rabbitmq` | AMQP `5672`, UI `http://localhost:15672` | User `lms`, mật khẩu `lms123` |
| Seq | `lms-seq` | UI `http://localhost:8081` (đẩy log qua cổng `5341`) | Lần đầu đăng nhập: `Admin@123` |
| Jaeger | `lms-jaeger` | `http://localhost:16686` | OTLP gRPC `4317` |
| Keycloak | `lms-keycloak` | `http://localhost:18080` | Realm dev: `logistics_realm` |
| Ordering API | `lms-ordering-api` | `http://localhost:5000` | Kiểm tra nhanh: `GET /health` |
| Warehouse API | `lms-warehouse-api` | `http://localhost:5051` | Kiểm tra nhanh: `GET /health` |

**Vì sao cần bảng này:** khi có sự cố, luôn làm việc với ba thứ: **log trên Seq**, **hàng đợi RabbitMQ**, và **hai DB** trong cùng một Postgres.

---

## 2) Khởi động stack và smoke test health

Từ thư mục gốc repo:

```bash
docker compose -f deploy/docker/docker-compose.local.yml up -d --build
docker compose -f deploy/docker/docker-compose.local.yml ps
```

Smoke test (kỳ vọng HTTP 200):

```bash
curl -s http://localhost:5000/health
curl -s http://localhost:5051/health
```

**Tại sao:** xác nhận API và phụ trợ đã chạy; health fail thì **xử lý hạ tầng trước**, đừng đi vào chi tiết nghiệp vụ.

---

## 3) Cheat sheet Seq (xuyên dịch vụ)

1. Mở `http://localhost:8081`, đăng nhập.
2. Ví dụ bộ lọc (điều chỉnh cho đúng template Serilog của bạn):
   - Theo correlation header: `@MessageTemplate like '%corr%' or CorrelationId = 'your-value'`
   - Theo ứng dụng: `Application = 'Ordering.Api'` hoặc `'Warehouse.Api'`
   - Theo đơn: tìm ký tự GUID `orderId` hoặc mã waybill trong ô tìm kiếm tự do.

**Tại sao:** Phase C mong muốn trả lời trong vài phút: «message này fail chỗ nào, đã retry bao lần»; Seq là tín hiệu chung cho Ordering và Warehouse.

---

## 4) Playbook cho vài incident thường gặp

### 4.1 ERP sync như đứng hoặc lỗi (Ordering)

**Dấu hiệu:** bảnh `erp_skus` / `erp_warehouses` không cập nhật; log worker ErpSync có lỗi trên Seq.

**Kiểm tra độ trễ (DB OMS):**

```bash
docker exec -it lms-postgres psql -U postgres -d lms_oms_dev -c "SELECT tenant_id, entity_type, last_synced_at, last_success_cursor FROM erp_sync_checkpoints ORDER BY tenant_id, entity_type;"
```

So `last_synced_at` với thời gian hiện tại (UTC). Nếu quá cũ và Seq có lỗi HTTP, kiểm tra **mock ERP** có gọi được không (`ErpSync__BaseUrl` trong compose dùng `host.docker.internal`).

**Tại sao:** bảnh checkpoint là anchor cho cursor đồng bộ — tránh đoán nhầm chỉ nhìn UI.

### 4.2 Consumer kẹt / poison message (Warehouse / Ordering)

**Dấu hiệu:** luồng transfer không chạy tiếp; độ sâu hàng đợi RabbitMQ tăng; Seq lặp exception.

1. Vào RabbitMQ UI → **Queues** → tìm các queue của consumer MassTransit (tên thường kiểu kebab-case).
2. Xem **ready / unacked**; nếu có cấu hình DLQ / dead-letter thì kiểm tra thêm.
3. Ghép timestamp với log trên Seq theo kiểu exception.

**Tại sao:** tắc hàng đợi và poison hiện rõ nhất ở broker; Seq giải thích lý do lỗi.

### 4.3 Rollback migration EF (**chỉ dùng trên máy dev**)

**Cảnh báo:** production phải có quy trình riêng; đây là cho **Postgres dev** trong container `lms-postgres`.

1. Xác định tên migration trước đó trong thư mục `Persistence/Migrations` của `Ordering.Infrastructure` / `Warehouse.Infrastructure`.
2. Trên máy dev (ngoài container), connection string trỏ tới host cổng `56432`:

```bash
dotnet ef database update <PreviousMigrationId> --project src/Services/Ordering/Ordering.Infrastructure --startup-project src/Services/Ordering/Ordering.Api
```

Lặp tương tự Warehouse với startup project của Warehouse và connection string vào DB `lms_wms_dev`.

**Tại sao:** vẫn cần lối thoát khi migrate nhầm trên máy cục bộ trong giai đoạn C1 chỉ có tài liệu.

---

## 5) Tài liệu liên quan

- Ghi chú MVP ERP/smoke: [erp_ops_runbook.txt](./erp_ops_runbook.txt)
- Replay và kiểm idempotency: [replay-verification.md](./replay-verification.md)

---

## 6) C1 metric baseline (chạy trong Docker)

Mục này dùng để trả lời nhanh 3 câu hỏi vận hành của C1: queue có dồn không, ERP sync có lag không, replay có tạo side-effect trùng không.

### 6.1 Queue depth / unacked

```bash
docker exec lms-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged
```

**Diễn giải nhanh:**
- `messages_ready` tăng liên tục -> consumer có thể không theo kịp.
- `messages_unacknowledged` giữ cao lâu -> consumer có nguy cơ kẹt hoặc poison loop.

### 6.2 ERP sync lag (OMS)

```bash
docker exec lms-postgres psql -U postgres -d lms_oms_dev -c 'SELECT "TenantId", "EntityType", "LastSyncedAt", EXTRACT(EPOCH FROM (NOW() AT TIME ZONE '"'"'"'"'"'"'"'"'UTC'"'"'"'"'"'"'"'"' - "LastSyncedAt"))::bigint AS lag_seconds FROM erp_sync_checkpoints ORDER BY "TenantId", "EntityType";'
```

**Diễn giải nhanh:**
- `lag_seconds` nhỏ và dao động -> worker sync bình thường.
- `lag_seconds` tăng liên tục + Seq có lỗi HTTP -> kiểm tra upstream ERP hoặc network.

### 6.3 Replay/idempotency check

Thực thi theo [replay-verification.md](./replay-verification.md), tập trung vào:
- Count `InboundReceipts` không tăng bất thường khi duplicate sort/replay.
- Count `OrderStatusHistories` không sinh transition sai luật.
- Log `Skip duplicate pre-create` xuất hiện ở Warehouse khi duplicate path xảy ra.
