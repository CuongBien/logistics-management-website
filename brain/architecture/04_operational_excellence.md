# Operational Excellence & Observability

## 1. Observability (Khả năng quan sát)

Để vận hành hệ thống Microservices phức tạp, không thể "đoán mò" lỗi. Cần có dữ liệu rõ ràng.

### 1.1. Distributed Tracing (Truy vết phân tán)

- **Standard:** Sử dụng **OpenTelemetry** (OTEL) - tiêu chuẩn công nghiệp hiện nay.
- **Collector & Visualization:**
  - Sử dụng **Jaeger** hoặc **Zipkin** để visualize luồng đi của request qua nhiều services (OMS -> Gateway -> WMS -> DB).
  - Giúp phát hiện "nút thắt cổ chai" (bottleneck) về hiệu năng.

### 1.2. Centralized Logging (Ghi log tập trung)

- **Library:** **Serilog** cho .NET applications. Sử dụng _Structured Logging_ (JSON) thay vì text thuần túy để dễ query.
- **Stack:** **ELK Stack** (Elasticsearch, Logstash, Kibana) hoặc **Seq** (nhẹ hơn, tối ưu cho .NET).
- **Correlation ID:** Mọi log trong cùng một request flow phải gắn chung một `CorrelationId` để dễ dàng filter.

### 1.3. Metrics & Monitoring

- **Stack:** Prometheus + Grafana
- **Custom Metrics:**
  - Business metrics: Số đơn hàng/phút, tỷ lệ thành công giao hàng
  - Technical metrics: CPU/Memory per pod, API latency percentiles
- **Alerting Rules:**
  - Critical: API error rate > 5% trong 5 phút
  - Warning: Queue depth > 10,000 messages
  - Info: Deployment events

## 2. Contingency Plan (Dự phòng & Khôi phục)

### 2.1. Backup & DR (Disaster Recovery)

- **RPO (Recovery Point Objective):** Chấp nhận mất dữ liệu tối đa 15 phút.
  - Database SQL: Bật tính năng Point-in-time Recovery (PITR) của Cloud Provider hoặc backup log định kỳ.
- **RTO (Recovery Time Objective):** Thời gian khôi phục tối đa 4 giờ.
- **Geo-Redundancy:** Dữ liệu quan trọng (Master Data) nên được replicate sang 1 Region khác nếu ngân sách cho phép.

### 2.2. Production Runbooks

Tài liệu "Sổ tay vận hành" cho đội trực sự cố (On-call):

- **High Latency:** Làm gì khi API phản hồi chậm? (Check Database CPU, check Connection Pool).
- **Service Down:** Start lại Pod K8s, kiểm tra log lỗi gần nhất.
- **Queue Backlog:** Làm gì khi Kafka bị ứ đọng hàng triệu message? (Scale thêm consumer, kiểm tra consumer có bị lỗi logic không).

### 2.3. Chaos Engineering (Long-term)

- **Tools:** Chaos Mesh
- **Scenarios:** Simulate pod crashes, network latency, disk full