# Development Standards & QA

## 1. Quality Assurance Strategy

Chất lượng code được đảm bảo qua các lớp kiểm thử tự động.

### 1.1. Functional Testing

- **Unit Testing:** Bắt buộc với Business Logic. Sử dụng **xUnit** + **FluentAssertions**.
- **Integration Testing:** Test luồng API thực tế (có connect DB thật hoặc Docker Container). Sử dụng **Testcontainers** để dựng môi trường sạch cho mỗi lần test.

### 1.2. Performance & Load Testing

Trước khi golive feature lớn, phải có kết quả Load Test.

- **Tools:**
  - **K6:** Scripting bằng JS, nhẹ, dễ tích hợp CI/CD. Dùng để test API Performance.
  - **JMeter:** Dùng cho các kịch bản test phức tạp, giao thức cũ hơn nếu cần.
- **Benchmarks:**
  - API Response Time (P95) < 300ms.
  - Chịu tải được X requests/second (tùy module).

### 1.3. Contract Testing

- **Tool:** Pact hoặc Spring Cloud Contract
- **Purpose:** Đảm bảo Producer và Consumer của Events không breaking changes

## 2. Documentation Strategy

Tài liệu phải "sống" cùng code (Code-first documentation).

- **API Documentation:** Sử dụng **Swagger (OpenAPI Specification)**. Phải có đầy đủ description cho params, response types, và error codes.
- **Event Documentation:** Sử dụng **AsyncAPI**. Mô tả rõ cấu trúc message (JSON Schema) của các sự kiện trên Kafka/RabbitMQ để team khác dễ tích hợp.

## 3. Developer Onboarding

Giúp dev mới hòa nhập nhanh trong 1 tuần.

- **Standard Environment:** Cung cấp file `docker-compose.yml` dựng toàn bộ infrastructure (Redis, Postgres, Kafka) local chỉ bằng 1 lệnh `docker-compose up`.
- **Coding Conventions:** Tuân thủ `.editorconfig` và StyleCop của dự án.
- **Knowledge Base:** Đọc kỹ bộ tài liệu `brain/architecture/` này trước khi code dòng đầu tiên.

### 4. Git Workflow

- **Strategy:** Trunk-based development với feature flags
- **Branch naming:** feature/TICKET-123-description
- **PR Requirements:**
  - Minimum 2 reviewers
  - All tests passed
  - Code coverage > 80% cho new code
  
### 5. Environment Strategy

- **Development:** Local Docker Compose
- **Testing:** K8s cluster với real-like data
- **Staging:** Production clone với sanitized data
- **Production:** Multi-region setup (nếu cần)
