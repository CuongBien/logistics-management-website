# Bài 1: Clean Architecture (Kiến Trúc Sạch Thực Chiến)

Dành cho toàn bộ team: Dưới đây là cách chúng ta chia 4 thư mục chính trong 1 Microservice (như `OMS` hay `WMS`). Mỗi tầng sẽ có quy tắc riêng và **phải đi kèm với Code ví dụ** để mọi người có thể hiểu cách áp dụng thực tế và chuẩn mực nhất khi code dự án Logistics này.

---

## 🧭 1. Khái Niệm Lõi: Sự Phụ Thuộc (Dependency Rule)

Luật bất biến của team: **Tầng bên trong KHÔNG BAO GIỜ biết sự tồn tại của tầng bên ngoài.**
Trình tự gọi / tham chiếu project: `Domain` $\leftarrow$ `Application` $\leftarrow$ `Infrastructure` & `Api`.

Nếu bạn đang code trong thư mục `Domain` mà phải gõ lệnh `using Microsoft.EntityFrameworkCore`, **bạn đã vi phạm luật kiến trúc**.

---

## 🔴 2. Tầng `Domain` (Trái Tim Nghiệp Vụ)
Nơi duy nhất chứa các quy tắc sống còn của ứng dụng kinh doanh (Ví dụ: "Đơn hàng phải ở trạng thái Created mới được nhận"). **Chỉ dùng C# thuần**.

**Ví dụ Code (Tạo file `Order.cs` trong `OMS.Domain/Aggregates/Order/`)**:
```csharp
using Shared.Domain; // Nhóm chỉ dùng thư viện nội bộ nền tảng, không có DB framework

public class Order : AggregateRoot
{
    // Bắt buộc đặt 'private set' để KHÔNG AI ở tầng Application (chứ chưa nói Controller) có thể can thiệp sửa lung tung
    public Guid Id { get; private set; }
    public OrderStatus Status { get; private set; }
    
    // Thuộc tính List (Danh sách hàng) phải được giấu kín sau một lớp ReadOnly
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    
    // Chỉ có Constructor mới có quyền sinh ra Đối tượng từ đầu
    public Order(Guid customerId) 
    {
        Id = Guid.NewGuid();
        Status = OrderStatus.Created;
    }

    // Nghiệp vụ (Business logic) thực sự BẮT BUỘC nằm ở bên trong các Method này
    public void Confirm() 
    {
        if (Status != OrderStatus.Created) 
            throw new DomainException("Chỉ đơn hàng Mới được phép xác nhận.");
            
        Status = OrderStatus.Confirmed;
    }
}
```

---

## 🟠 3. Tầng `Application` (Nhạc Trưởng Điều Phối)
Nơi này nhận yêu cầu User Cases (cqrs Command), gọi ra lệnh cho Database lấy dữ liệu $\rightarrow$ giao cho Domain tính toán xử lý $\rightarrow$ ra lệnh Database lưu lại.

**Ví dụ Code 1 - Define nhu cầu cho Infrastructure qua Interface (Luật Interface Segregation)**:
```csharp
// Đặt tại File: OMS.Application/Contracts/IOrderRepository.cs
public interface IOrderRepository
{
    Task AddAsync(Order order);
    Task<Order?> GetByIdAsync(Guid id);
}
```

**Ví dụ Code 2 - Handler Điều Phối CQRS**:
```csharp
// Đặt tại File: OMS.Application/Orders/Commands/CreateOrderCommandHandler.cs
using MediatR;
using OMS.Application.Contracts;
using OMS.Domain.Aggregates.Order;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _repo;
    private readonly IUnitOfWork _uow; // Chịu trách nhiệm gọi SaveChangesAsync

    // Luôn luôn Têm phụ thuộc (Dependency Injection) qua cú pháp Constructor
    public CreateOrderCommandHandler(IOrderRepository repo, IUnitOfWork uow) 
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        // 1. Khởi tạo đối tượng Domain hoàn toàn bằng nghiệp vụ lõi
        var order = new Order(request.UserId);
        
        // 2. Lưu vào Danh sách đệm (Repository Pattern)
        await _repo.AddAsync(order);
        
        // 3. Chốt lưu vật lý xuống Table (Postgres) thực sự
        await _uow.SaveChangesAsync(ct); 
        
        return Result.Success(order.Id);
    }
}
```

---

## 🟡 4. Tầng `Infrastructure` (Kẻ Làm Thuê Dữ Liệu)
Đây là tầng "Bẩn" nhất, chứa các Framework nặng nề: Entity Framework SQL, Driver RabbitMQ, SMTP Mail. Nó là công cụ nhằm thỏa mãn mong muốn của bằng cách Tự tay Implements Interface của `Application`.

**Ví dụ Code - Cách kết nối làm hài lòng Tầng App**:
```csharp
// Đặt tại File: OMS.Infrastructure/Persistence/OrderRepository.cs
using Microsoft.EntityFrameworkCore;
using OMS.Application.Contracts;
using OMS.Domain.Aggregates.Order;

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _dbContext;

    public OrderRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Nơi duy nhất các lệnh .AddAsync của thư viện EF Core được gõ
    public async Task AddAsync(Order order)
    {
        await _dbContext.Orders.AddAsync(order); 
    }
    
    // Nơi duy nhất các truy vấn LINQ + FirstOrDefaultAsync tồn tại
    public async Task<Order?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Orders.FirstOrDefaultAsync(o => o.Id == id);
    }
}
```

---

## 🟢 5. Tầng `Api` (Lễ Tân Bắt Khách)
Nơi trực tiếp hứng Endpoint từ Postman (`HTTP POST`, `GET`). Không có chút logic code C# nào (if, else tính chiết khấu...) được quyền đứng ở đây. 

**Ví dụ Code - API Controller mỏng như chiếc lá**:
```csharp
// Đặt tại File: OMS.Api/Controllers/OrdersController.cs
using Microsoft.AspNetCore.Mvc;
using MediatR;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        // Gói HTTP Request thành Object Command, ném dứt điểm cho Tầng Application (MediatR nhận lệnh)
        var command = new CreateOrderCommand(request.UserId, request.Items);
        var result = await _mediator.Send(command);

        // Quy luật biến thành Status Code API 1 cách văn minh
        if (result.IsSuccess)
        {
            return Ok(new { OrderId = result.Value }); // 200 OK
        }
        
        return BadRequest(result.Error); // 400 Lỗi
    }
}
```

✅ **Chốt Bài 1 (Cách Flow Đi)**: Toàn bộ quá trình chạy Data trên mọi task chúng ta sẽ làm:
**API Controller (Dịch vụ ngoài/HTTP)** $\rightarrow$ **Application Command (Bọc yêu cầu)** $\rightarrow$ **Domain (Đốt cháy logic cấm cản)** $\rightarrow$ **Infrastructure (Query/Update SQL)**. Mọi thứ đều test độc lập được!
