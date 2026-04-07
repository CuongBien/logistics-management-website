# 🏗️ Kiến trúc & Pattern Cốt lõi (In-Depth Guide)

Tài liệu này không chỉ là khái niệm mà là **Hướng dẫn Thực hành (How-to)** cho toàn bộ 5 thành viên trong team. Mọi doạn code viết ra đều phải tuân thủ nghiêm ngặt các pattern dưới đây.

---

## 1. Clean Architecture & DDD (Quy tắc "Không Vượt Rào")

Kiến trúc chia làm 4 project chính. **Nguyên lý Tối thượng (Dependency Inversion):** Các lớp bên ngoài (Api, Infrastructure) phụ thuộc vào lớp bên trong (Domain, Application). Lớp bên trong KHÔNG ĐƯỢC biết lớp bên ngoài là gì.

### 📌 `Project.Domain` (Trái tim của hệ thống)
*Nơi chứa luật kinh doanh thuần túy. Chỉ dùng code C# thuần, KHÔNG cài EntityFramework, KHÔNG cài thư viện ngoài (trừ MediatR cho Event).*

- **Entity & Aggregate Root:**
  - Thuộc tính (Properties) `set` phải mang tính `private` bảo mật.
  - Thay đổi trạng thái thông qua các phương thức (Methods).
  - **Checklist Team:** *Đừng bao giờ viết `order.Status = Status.Paid;` ở Controller. Phải viết `order.MarkAsPaid();`*.

```csharp
// 🟢 TỐT: Đóng gói chặt chẽ (Encapsulation)
public class Order : AggregateRoot
{
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }
    
    // Khởi tạo phải hợp lệ ngay từ đầu
    public Order(Guid customerId) 
    {
        Id = Guid.NewGuid();
        Status = OrderStatus.Created;
    }

    // Hành vi thay đổi trạng thái sinh ra Domain Event
    public void Confirm() 
    {
        if (Status != OrderStatus.Created) throw new DomainException("Chỉ đơn Mới được xác nhận.");
        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmedDomainEvent(this.Id));
    }
}
```

### 📌 `Project.Application` (Người điều phối)
*Chứa User Cases (CQRS). Tham chiếu tới thư viện `MediatR` và `FluentValidation`.*

- Luôn định nghĩa Interface cho repository ở đây: `public interface IOrderRepository { Task AddAsync(Order order); }`.
- **Checklist Team:** *Không viết thao tác trích xuất DB (`SaveChanges`, `_dbContext.Set<>`) ở Application.*

---

## 2. CQRS bằng MediatR Pipeline

### Cấu trúc 1 Use Case (Command)
Thay vì nhồi nhét code vào Service, mỗi chức năng là 1 class độc lập.

**1. Định nghĩa Command:**
```csharp
// Đừng trả về thẳng object Domain, hãy trả về Result<>
public record CreateOrderCommand(Guid UserId, List<OrderItemDto> Items) : IRequest<Result<Guid>>;
```

**2. Validation (Chạy Tự Động trước khi vào Handler):**
```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("UserId không được rỗng");
        RuleFor(x => x.Items).NotEmpty().WithMessage("Đơn hàng phải có ít nhất 1 món");
    }
}
```

**3. Handler (Xử lý chính):**
```csharp
internal sealed class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateOrderCommandHandler(IOrderRepository repo, IUnitOfWork uow) { ...  }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var order = new Order(request.UserId);
        
        await _repo.AddAsync(order);
        await _uow.SaveChangesAsync(ct); // Nơi Domain Event tự bắn đi
        
        return Result.Success(order.Id);
    }
}
```

---

## 3. Result Object Pattern (Kết liễu Exception)

`Try/Catch` rất chậm. Chống chỉ định dùng `throw new Exception` để kiểm soát luồng!

**Cấu trúc một `Error` chuẩn của team:**
```csharp
public record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
}

// Gom nhóm lỗi theo Domain
public static class DomainErrors
{
    public static class Order
    {
        public static readonly Error NotFound = new("Order.NotFound", "Không tìm thấy mã đơn hàng.");
        public static readonly Error OutOfStock = new("Order.OutOfStock", "Sản phẩm đã hết hàng.");
    }
}
```

**Controller Controller nhận kết quả và Map ra HTTP Status:**
```csharp
[HttpPost]
public async Task<IActionResult> Create(CreateOrderCommand command)
{
    Result<Guid> result = await _sender.Send(command);

    if (result.IsFailure)
    {
        // Tuỳ biến trả về 400 Bad Request theo format ProblemDetails RFC
        return BadRequest(new ProblemDetails
        {
            Title = "Bad Request",
            Status = StatusCodes.Status400BadRequest,
            Detail = result.Error.Message
        });
    }

    return Ok(result.Value);
}
```

✅ **Chốt kiến thức:** 5 bạn dev phải nắm rõ: Nhận HTTP Request $\rightarrow$ Chuyển thành Command $\rightarrow$ Trượt qua Pipeline Validation $\rightarrow$ Handler móc Domain xử lý $\rightarrow$ Trả về Result $\rightarrow$ Controller phân dải thành 200 OK hoặc 400 Bad Request. Mượt mà, sạch sẽ!
