# Kiến trúc hệ thống & Các Pattern Cốt lõi (Architecture & Core Patterns)

Tài liệu này tổng hợp các khái niệm, quy tắc và ví dụ về kiến trúc tổng thể cũng như các Design Pattern cốt lõi được sử dụng trong dự án Logistics (LMS).

---

## 1. Clean Architecture & Domain-Driven Design (DDD)

Dự án áp dụng chặt chẽ Clean Architecture kết hợp với Domain-Driven Design (DDD) để đảm bảo code dễ bảo trì, testable và không phụ thuộc vào Framework quá nhiều. 

Mỗi Microservice (ví dụ: `Shared`, `OMS`, `WMS`) đều tuân thủ cấu trúc thư mục 4 lớp:

- **`Domain` (Lõi trung tâm):** Nơi chứa Entities, Value Objects, Domain Exceptions và Domain Events. Tầng này **TUYỆT ĐỐI KHÔNG** được reference tới bất kỳ thư viện ngoại vi nào (không EF Core, không RabbitMQ).
- **`Application` (Luồng nghiệp vụ):** Nơi chứa các Use Cases (Command/Query), DTOs, Validation. Tầng này định nghĩa các Interfaces mà nó cần (ví dụ: `IRepository`).
- **`Infrastructure` (Hạ tầng):** Nơi thực thi các Interfaces từ `Application` (ví dụ: DbContext của EF Core, gửi Email, RabbitMQ message broker).
- **`Api` / `Presentation`:** Điểm chạm với Client, nơi chứa các Controllers, Middleware, SignalR Hubs, map HTTP requests sang MediatR Commands/Queries.

### Ví dụ (Aggregates & Domain Events):
Khi tạo một `Order`, ta thao tác trên aggregate root là `Order`. Trạng thái thay đổi bên trong aggregate sẽ văng ra một sự kiện (Domain Event) thay vì gọi trực tiếp sang module khác:
```csharp
public class Order : AggregateRoot
{
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    
    public void AddItem(Product product, int quantity)
    {
        // ... validation rules
        var item = new OrderItem(product.Id, quantity);
        _items.Add(item);
        
        // Thêm sự kiện nội bộ để Dispatcher đẩy đi sau khi SaveChanges
        AddDomainEvent(new OrderItemAddedEvent(this.Id, item.Id));
    }
}
```

---

## 2. CQRS (Command Query Responsibility Segregation)

Để tăng hiệu năng và chuẩn hóa cách viết API, dự án dùng pattern CQRS thông qua thư viện **MediatR**.

- **Command (Ra lệnh - Thay đổi dữ liệu):** Dùng cho các HTTP method như `POST`, `PUT`, `DELETE`. Command sẽ đi kèm với FluentValidation trước khi chạy vào Handler.
- **Query (Truy vấn - Chỉ đọc):** Dùng cho HTTP `GET`. Thường dùng EF Core `.AsNoTracking()` hoặc Dapper để lấy dữ liệu nhanh chóng mà không theo dõi Entity.

### Ví dụ luồng CQRS qua controller:
```csharp
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command)
    {
        // MediatR sẽ tìm Handler tương ứng để chạy
        var result = await _mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
```

---

## 3. Result Pattern

Tránh việc văng Exception logic (throw Exception) bừa bãi làm giảm hiệu năng hệ thống và khó bắt lỗi. Thay vào đó, API và Command Handler trả về một Object `Result<T>` đóng gói trạng thái Thành công / Thất bại và chi tiết mã lỗi.

### Quy tắc áp dụng:
- Domain Exception chỉ được throw khi hệ thống gặp lỗi vi phạm quy tắc đặc biệt nghiêm trọng của miền dữ liệu (Domain Invariants).
- Cắt gọt Input không hợp lệ bằng FluentValidation, nếu qua Validation mà logic Fail (kiểu "hết hàng tĩnh") thì trả về `Result.Failure(Error...)`.

### Ví dụ (Result Pattern Type):
```csharp
public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
{
    if (!HasInventory(request.Sku))
    {
        // Không throw Exception, trả về đối tượng lỗi có cấu trúc
        return Result.Failure<Guid>(DomainErrors.Order.OutOfStock);
    }
    
    var order = new Order(request.UserId);
    await _repository.AddAsync(order);
    
    return Result.Success(order.Id);
}
```

---
*Checklist này đánh dấu nền tảng đầu tiên - Việc nắm vững Clean Architecture + CQRS + Result Pattern là điều kiện tiên quyết trước khi đụng vào Messaging (RabbitMQ/MassTransit) ở bài tiếp theo.*
