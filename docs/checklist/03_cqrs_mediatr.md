# Bài 3: CQRS & MediatR (Phân Trách Nhiệm Đọc/Ghi)

Trong các lớp học lập trình cũ, chúng ta quen dùng `IOrderService` (chứa 1 mớ hàm `Create`, `Update`, `Delete`, `GetById`, `GetAll`...). Nét code này trong dự án lớn (như Logistics) được gọi là **Code Phình To (Fat Service)**, cực kì khó test và dễ dẫm chân lên nhau khi merge code.

Giải pháp của team mình là: **CQRS (Command-Query Responsibility Segregation)** kết hợp với thư viện **MediatR**.

---

## ⚖️ 1. Khái Niệm Lõi: Chia Cắt Đọc vs Ghi

Mỗi chức năng (Use Case) trong hệ thống được tách ra thành 1 class độc lập riêng biệt. Không có chuyện hàm "Tạo đơn" nằm chung file với hàm "Lấy đơn".

- **Command (Mệnh Lệnh):** Hành động làm **THAY ĐỔI** dữ liệu (`POST`, `PUT`, `DELETE`). Trả về Result, thường phải đi qua Aggregate Root và Entity Framework (`SaveChanges`).
- **Query (Truy Vấn):** Hành động **CHỈ ĐỌC** dữ liệu (`GET`). Trả về DTO (Data Transfer Object). Thường dùng `Dapper` (viết SQL thuần cho nhanh) hoặc cắm EF Core nhưng BẮT BUỘC có hàm `.AsNoTracking()` để tiết kiệm RAM.

---

## 🔨 2. Cấu Trúc File & Bắt Lỗi Bằng FluentValidation

Team sẽ không bao giờ viết code rác rưởi kiểu `if (request.Price < 0) return BadRequest();` bên trong API Controller hay Handler nữa. Việc đó do **Pipeline Behavior** (màng lọc tự động) đảm nhiệm!

**Ví dụ Code 1 - Định nghĩa Command & Validator (Nằm cùng 1 file, ví dụ `CreateOrderCommand.cs`):**
```csharp
using MediatR;
using FluentValidation;

// 1. Gói hàng (Input của Web)
// Bắt buộc kế thừa IRequest<Result<T>> để chuẩn hóa đầu ra
public record CreateOrderCommand(Guid UserId, string Address) : IRequest<Result<Guid>>;

// 2. Trạm kiểm tra an ninh (Khởi tạo Validator)
// Class này sẽ tự động chạy TRƯỚC khi Command lọt vào được Handler.
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("Mã khách hàng không được để trống.");
            
        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Phải có địa chỉ.")
            .MaximumLength(150).WithMessage("Địa chỉ quá dài.");
    }
}
```

---

## 🚀 3. Cách Cài Đặt Handler (Xưởng Xử Lý)

Khi gói hàng đã qua cổng an ninh `Validator` không có vấn đề gì, nó văng vào `Handler`.

**Ví dụ Code 2 - Command Handler (Thực Thi Thay Đổi Database):**
```csharp
// Thuộc tính IRequestHandler báo cho MediatR biết đây là xưởng xử lý của CreateOrderCommand
internal sealed class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _repo;
    private readonly IUnitOfWork _uow;

    public CreateOrderCommandHandler(IOrderRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        // ... (Logic gọi Domain xử lý như ở Bài 1) ...
        var order = new Order(request.UserId);
        
        await _repo.AddAsync(order);
        await _uow.SaveChangesAsync(ct);
        
        return Result.Success(order.Id);
    }
}
```

**Ví dụ Code 3 - Query Handler (Đọc Siêu Tốc Bằng Dapper Hoặc AsNoTracking):**
```csharp
public record GetOrderByIdQuery(Guid OrderId) : IRequest<Result<OrderDto>>;

internal sealed class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderDto>>
{
    private readonly ApplicationDbContext _dbContext; // Dùng trực tiếp DbContext để ĐỌC (Ai cấm đâu!)

    public GetOrderByIdQueryHandler(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result<OrderDto>> Handle(GetOrderByIdQuery request, CancellationToken ct)
    {
        // Bắt buộc dùng .AsNoTracking() để truy vấn không bị dính vào bộ nhớ Tracking của EF
        var order = await _dbContext.Orders
            .AsNoTracking()
            .Where(x => x.Id == request.OrderId)
            .Select(x => new OrderDto(x.Id, x.Status.ToString())) // Trả về DTO mỏng nhẹ, không trả về Aggregate rườm rà
            .FirstOrDefaultAsync(ct);

        if (order is null)
        {
            return Result.Failure<OrderDto>(DomainErrors.Order.NotFound);
        }

        return Result.Success(order);
    }
}
```

---

## 🎧 4. Việc Của API Controller Là Gì?

Bây giờ API Controller của ae sẽ chỉ còn đúng 2 dòng bất định: Nhận request $\rightarrow$ Ném cho `ISender` (một phần của `IMediator`). Chấm Hết. Bạn nào viết Logic if else ở Controller là phạt 1 chầu Cà phê!

```csharp
[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly ISender _sender; // Inject ISender thay vì IMediator cho đúng chuẩn DDD

    public OrdersController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateOrderCommand command)
    {
        // 🔮 Phép màu: Lệnh Send sẽ tự đẩy Command qua Validator. 
        // Nếu lỗi, Pipeline sẽ tự chặn và trả về lỗi. Nếu xanh, nó mới gọi thẳng tới Handler!
        var result = await _sender.Send(command);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
    
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var result = await _sender.Send(new GetOrderByIdQuery(id));
        
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }
}
```

✅ **Chốt Bài 3**: Hãy đối xử với MediatR như cái bưu điện. Controller gửi thư (`ISender.Send()`), và hệ thống sẽ tự tìm ông Shipper (Handler) phụ trách loại thư đó để giao việc. Còn mấy cái `FluentValidation` chính là hải quan kiểm soát gói hàng độc hại ở biên giới. Mọi thứ tự động hóa!
