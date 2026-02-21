# Sprint 2: OMS Core Business Logic

**Goal:** Hoàn thiện luồng nghiệp vụ chính của OMS: Tạo đơn hàng (Create Order), Validate rules, Lưu xuống DB (Postgres), và Publish sự kiện (OrderCreated) qua Outbox Pattern.

## High Priority (Must Do)

### 1. Domain Layer (The Heart)

- [x] **Order Aggregate:** Implement logic `Create`, `AddOrderItem`, `Cancel`.
- [x] **Domain Rules:** Check valid pricing, đảm bảo Order phải có ít nhất 1 Item.
- [x] **Domain Events:** Khởi tạo `OrderCreatedDomainEvent` bên trong Aggregate.

### 2. Infrastructure Layer (Persistence & Messaging)

- [x] **EF Core Configurations:** Viết `IEntityTypeConfiguration` cho `Order`, `OrderItem`.
- [x] **DbContext Setup:** Implement `IApplicationDbContext`, override `SaveChangesAsync` để tự động dispatch Domain Events.
- [x] **MassTransit Outbox:** Cấu hình Entity Framework Outbox pattern để đảm bảo event không bị mất nếu DB lưu thành công nhưng RabbitMQ sập.
- [x] **Migrations:** Tạo và chạy Initial Migration (Postgres).

### 3. Application Layer (Use Cases - CQRS)

- [x] **CreateOrderCommand:** Handler xử lý tạo đơn -> Gọi DB Context lưu -> Map DomainEvent sang `OrderCreatedIntegrationEvent` và Publish qua MassTransit.
- [x] **GetOrderByIdQuery:** Query chi tiết đơn hàng (Sử dụng EF Core `.AsNoTracking()`).
- [x] **Validations:** FluentValidation cho Inputs (NotEmpty, MinValue...).

## Technical Debts / Extensions

- [x] **Global Exception Handling:** Sử dụng `.NET 8 IExceptionHandler` bắt lỗi Domain Exception -> mapping ra ProblemDetails (400 Bad Request).
- [x] **Logging Pipeline:** Log mọi request/response/execution time qua `IPipelineBehavior` của MediatR.

## Done Criteria

1. API `POST /api/orders` chạy thành công, data vào Postgres, và thấy Message xuất hiện trên RabbitMQ (nếu bật).
2. API `GET /api/orders/{id}` trả về đúng data.
3. Code Clean Architecture, test được (Testable).
