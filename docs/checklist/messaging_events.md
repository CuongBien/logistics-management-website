# 📬 Giao tiếp & Bất đồng bộ (Thực chiến MassTransit & Saga)

Các bạn Dev hệ thống (Backend) cần đọc kỹ file này vì lỗi trong Microservices thường 90% xuất phát từ **Mất Message** hoặc **Sai Trình tự (Racing conditions)**.

---

## 1. MassTransit: Publisher & Consumer

MassTransit là một lớp bọc (wrapper) xịn xò cho RabbitMQ.

### Quy trình Bắn Event (Publishing)
Không gọi `_publishEndpoint.Publish()` trực tiếp trong logic kinh doanh nếu không dùng Outbox. 
- Mọi Integration Event (Event liên dịch vụ) phải đặt tại project `Shared.IntegrationEvents` để cả OMS và WMS cùng trỏ tới.
```csharp
// Shared project
public record ShipmentReceivedIntegrationEvent(Guid OrderId, DateTime ReceivedAt);
```

### Quy trình Lắng nghe (Consuming)
- Luôn inject phụ thuộc qua DI Constructor thay vì tạo mới.
```csharp
public class ShipmentReceivedConsumer : IConsumer<ShipmentReceivedIntegrationEvent>
{
    private readonly ILogger<ShipmentReceivedConsumer> _logger;
    // ... setup DbContext

    public async Task Consume(ConsumeContext<ShipmentReceivedIntegrationEvent> context)
    {
        var orderId = context.Message.OrderId;
        _logger.LogInformation("Nhận event nhập kho cho OrderId: {0}", orderId);
        
        // Làm gì đó với logic...
    }
}
```

---

## 2. Setup Transactional Outbox (Sống còn)

Cái lưới an toàn để "Không ai bị bỏ lại phía sau". Khi lưu DB thành công, Message phải nằm trong hàng đợi đợi gửi đi.

**Setup chuẩn trong thư mục `Infrastructure` của từng Service:**
```csharp
public static IServiceCollection AddMessaging(this IServiceCollection services, IConfiguration config)
{
    services.AddMassTransit(x =>
    {
        x.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
        {
            o.UsePostgres();
            o.UseBusOutbox(); 
            // Cấu hình để Worker tự động chui vào DB đọc Message lên RabbitMQ
        });

        x.UsingRabbitMq((context, cfg) =>
        {
            cfg.Host(config["RabbitMQ:Host"], h => {
                h.Username(config["RabbitMQ:Username"]);
                h.Password(config["RabbitMQ:Password"]);
            });
            cfg.ConfigureEndpoints(context); // Tự động Bind đúng Queues/Exchanges
        });
    });
    return services;
}
```
**Checklist Team:** Mỗi `DbContext` của từng service BẮT BUỘC phải kế thừa các bảng của Outbox (Add thêm Migration: `dotnet ef migrations add AddOutbox`).

---

## 3. Saga State Machine (Trùm Cuối)

Saga (Nhạc trưởng) đứng ở OMS sẽ điều phối Trạng Quá Trình mua hàng. Nó không làm nghiệp vụ, nó chỉ chờ nghe Event và đổi State.

**Tạo State Entity lưu Data:**
```csharp
public class OrderState : SagaStateMachineInstance
{
    public Guid CorrelationId { get; set; } // Phục vụ MassTransit
    public string CurrentState { get; set; } = string.Empty; // Trạng thái hiện tại
    public DateTime CreatedAt { get; set; }
    
    // Concurrency Token (Cực Quan Trọng)
    public int Version { get; set; } 
}
```

**Viết Machine (Quy tắc luồng):**
```csharp
public class OrderFulfillmentStateMachine : MassTransitStateMachine<OrderState>
{
    public State Created { get; private set; }
    public State InWarehouse { get; private set; }

    public Event<OrderCreatedIntegrationEvent> OrderCreated { get; private set; }
    public Event<ShipmentReceivedIntegrationEvent> ShipmentReceived { get; private set; }

    public OrderFulfillmentStateMachine()
    {
        InstanceState(x => x.CurrentState);

        // Khởi tạo Saga khi OrderCreated chạy tới
        Event(() => OrderCreated, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => ShipmentReceived, x => x.CorrelateById(m => m.Message.OrderId));

        Initially(
            When(OrderCreated)
                .Then(context => context.Saga.CreatedAt = DateTime.UtcNow)
                .TransitionTo(Created) // Lên State Created
        );

        // Khi đang ở Created, nghe thấy Nhập kho -> Đổi State
        During(Created,
            When(ShipmentReceived)
                .Then(context => Console.WriteLine("Đã nhập kho!"))
                .TransitionTo(InWarehouse) // Lên State InWarehouse
        );
    }
}
```

✅ **Chốt kiến thức team:** Luôn để ý **CorrelationId**. Nó là sợi chỉ đỏ xuyên suốt các request rời rạc. Lệnh gửi từ WMS sang OMS nếu không map đúng `CorrelationId` (ở đây là OrderId) thì Saga sẽ bơ cái event đó hoặc tạo đống Error rác trong queue RabbitMQ `_error`.
