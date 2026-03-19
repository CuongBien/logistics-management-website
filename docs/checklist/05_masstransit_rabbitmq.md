# Bài 5: Tích hợp RabbitMQ Bằng MassTransit

Chào mừng team đến với **Phần 2: Hệ Thống Phân Tán**. Ở Phần 1, chúng ta đã dùng MediatR để các class nói chuyện với nhau VÀO TRONG MỘT Microservice (`OMS`). 

Sang phần này, khi `OMS` muốn nói chuyện với `WMS` (nằm ở một server khác), chúng ta cấm tuyệt đối việc dùng HttpClient nối thẳng API. Nếu làm thế, lỡ server WMS sập, thằng OMS chết theo $\rightarrow$ Đứt dây truyền. 
Giải pháp: **Message Broker (RabbitMQ)** làm bưu điện trung gian. Nếu WMS sập, kiện hàng nằm chờ trong ống RabbitMQ, lúc nào WMS sống lại thì chạy tiếp.

Và để không phải code tay RabbitMQ khổ sở, ta dùng **hiệp sĩ MassTransit** bọc bên ngoài.

---

## 📨 1. Định Nghĩa 1 Lời Nhắn (Integration Event)

Mọi lời nhắn gửi liên Server (Microservices) ĐỀU PHẢI kế thừa chung một thẻ (ví dụ `IIntegrationEvent`) và BẮT BUỘC bỏ vào thư mục `Shared`. Nếu bỏ vào project của OMS, thằng WMS sẽ mù chữ không đọc được loại class đó.

**Ví dụ Code - Cách định nghĩa event ở Shared Project:**
```csharp
// Đặt tại File: Logistics.Shared/IntegrationEvents/OrderCreatedIntegrationEvent.cs
namespace Logistics.Shared.IntegrationEvents;

// Dùng record thay vì class cho gọn nhẹ, vì Event bắn ra KHÔNG ĐƯỢC PHÉP thay đổi (Immutable)
public record OrderCreatedIntegrationEvent(
    Guid OrderId, 
    string CustomerId, 
    List<ProductItem> Items,
    DateTime CreatedAt
);

public record ProductItem(Guid Sku, int Quantity);
```
*(Bí Quyết: Không nên gói Toàn bộ Data của Order vào Message, chỉ gói những dữ liệu tối thiết để kho làm việc. Gói to quá RabbitMQ nghẹt!)*

---

## ⚙️ 2. Đăng Ký Cấu Hình MassTransit Ở Cả 2 Server

Chúng ta phải móc nối MassTransit vào RabbitMQ trong quá trình Build Application.

**Ví dụ Code - Setup tại Program.cs của `OMS.Api` và `WMS.Api`**:
```csharp
builder.Services.AddMassTransit(x =>
{
    // Đăng ký Consumer (Bạn lắng nghe rải rác ở Service nào thì khai báo ở Service đó)
    // Nếu là nền tảng chỉ Đẩy thì bỏ dòng này đi!
    x.AddConsumer<OrderCreatedConsumer>();

    // Cấu hình máy chủ RabbitMQ
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Host"] ?? "localhost", "/", h =>
        {
            h.Username("guest"); // Tắt hardcode ở Prod nhé!
            h.Password("guest");
        });

        // Tự động nhận diện Đuôi Tên Queue hợp logic
        // VD: Nhận OrderCreatedConsumer -> Tạo queue "order-created"
        cfg.ConfigureEndpoints(context); 
    });
});
```

---

## 🚀 3. Cách Đẩy Một Lời Nhắn (Publishing)

Khi muốn đẩy đi 1 lời nhắn "Ê tui vừa tạo đơn hàng", ta KHÔNG DÙNG MediatR `ISender` nữa. Ta dùng `IPublishEndpoint` của MassTransit.

**Ví dụ Code - Đẩy thông báo ở tầng Application:**
```csharp
// File Handler CQRS Cũ ở Bài 3, nay được độ thêm RabbitMQ
using MassTransit;

internal sealed class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _repo;
    private readonly IUnitOfWork _uow;
    private readonly IPublishEndpoint _publishEndpoint; // <--- Của Thằng MassTransit

    public CreateOrderCommandHandler(
        IOrderRepository repo, 
        IUnitOfWork uow, 
        IPublishEndpoint publishEndpoint) // Inject trực tiếp!
    { ... }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        // 1. Lưu DB
        var order = new Order(request.UserId);
        await _repo.AddAsync(order);
        await _uow.SaveChangesAsync(ct); 
        
        // 2. Vẩy tay thông báo "Chào các anh em service khác, tôi vừa tạo xong cái Order này!"
        // Lệnh PUBLISH sẽ ném tới toàn bộ nhân viên rảnh rỗi (Broker Exchange)
        var msg = new OrderCreatedIntegrationEvent(order.Id, request.UserId, ...);
        await _publishEndpoint.Publish(msg, ct); 
        
        return Result.Success(order.Id);
    }
}
```

---

## 🎧 4. Cách Lắng Nghe Lời Nhắn (Consuming)

Bên kia đầu tuyến (`WMS.Api`), nó chỉ nằm rung đùi chờ RabbitMQ kêu lên. MassTransit sẽ tự bốc gói hàng và đút vào mồm `Consumer`.

**Ví dụ Code - Nhận hàng tại Kho (WMS):**
```csharp
// Đặt tại File: WMS.Application/Consumers/OrderCreatedConsumer.cs
using MassTransit;
using Logistics.Shared.IntegrationEvents;

// Bắt buộc kế thừa IConsumer<T>
public class OrderCreatedConsumer : IConsumer<OrderCreatedIntegrationEvent>
{
    private readonly IInventoryRepository _inventoryRepo;

    public OrderCreatedConsumer(IInventoryRepository inventoryRepo)
    {
        _inventoryRepo = inventoryRepo;
    }

    public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
    {
        var eventData = context.Message; // Bốc gói hàng xịn đây rồi!
        
        Console.WriteLine($"[WMS] Bắt đầu trừ kho phục vụ cho Đơn: {eventData.OrderId}");
        
        // Code trừ kho Database WMS ...
        foreach(var item in eventData.Items)
        {
            await _inventoryRepo.DeductAsync(item.Sku, item.Quantity);
        }
    }
}
```

✅ **Chốt Bài 5:** Tóm tắt 3 bước: 
1. Đặt thông báo thành `record` vào `Shared`. 
2. Một đầu cắm `IPublishEndpoint.Publish()`. 
3. Một đầu cắm `IConsumer<T>` ngồi nghe. 
**Chú ý:** Ở code phía trên, nếu *Lưu DB xong (Bước 1) mà điện cúp, sập hàm Publish (Bước 2)* thì chuyện gì xảy ra? Hệ thống bị mù: OMS tạo đơn xong nhưng WMS thì kho không bao giờ trừ! Để giải quyết cú Bug vỡ mồm này, xin mời Team qua bài 6: **Transactional Outbox**.
