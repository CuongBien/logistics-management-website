# Giao tiếp & Xử lý Bất đồng bộ (Messaging & Async Processing)

Dự án sử dụng kiến trúc Event-Driven Microservices, nơi các service cấu thành giao tiếp với nhau chủ yếu thông qua sự kiện (Events) thay vì gọi API trực tiếp (RPC). File này tóm tắt các kỹ thuật đảm bảo tính toàn vẹn dữ liệu trong môi trường phân tán.

---

## 1. RabbitMQ & MassTransit

`MassTransit` là thư viện abtraction mạnh mẽ cho C# để giao tiếp với các Message Broker như `RabbitMQ`. Nó giúp ta ẩn đi sự phức tạp của việc kết nối, retry, và route message.

- **Publisher (Bắn sự kiện):** Service gửi một `IntegrationEvent` báo cho hệ thống biết một hành động đã xảy ra (ví dụ: `OrderCreatedIntegrationEvent`).
- **Consumer (Lắng nghe sự kiện):** Service đăng ký nhận (subscribe) message. MassTransit sẽ tự động map và gọi class Consumer khi có message.

### Quy tắc đặt tên Integration Event:
Phân biệt với `DomainEvent` (chỉ chạy nội bộ 1 service), `IntegrationEvent` phải tuân theo chuẩn quá khứ và thuộc namespace Shared để các service đều hiểu.
Ví dụ: `ShipmentReceivedIntegrationEvent`.

---

## 2. Transactional Outbox Pattern

**Vấn đề lớn của Microservice:** Nếu ta lưu vào CSDL Postgres thành công, nhưng lệnh `Publish` qua RabbitMQ bị sập mạng $\rightarrow$ Hệ thống mất đồng bộ. Order báo tạo thành công nhưng Warehouse không bao giờ trừ kho.

**Giải pháp (Outbox):** Lưu Message Event chung vào cùng Database Context (chung 1 transaction) với Entity chính.
Dự án sử dụng cơ chế Outbox tích hợp sẵn của EF Core + MassTransit.

1. App lưu Order và IntegrationEvent vào Database. Nếu lỗi thì tự động Rollback cả hai $\rightarrow$ Không mất dữ liệu.
2. Background Worker của MassTransit định kỳ đọc bảng `OutboxMessage` và đẩy lên RabbitMQ. Nếu lúc này RabbitMQ sập, Worker sẽ chờ và đẩy lại sau $\rightarrow$ Đảm bảo gửi đi (At-least-once delivery).

```csharp
// Đăng ký Outbox trong Program.cs:
cfg.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
{
    o.UsePostgres();
    o.UseBusOutbox();
});
```

---

## 3. Saga Orchestration (State Machine)

Ban đầu hệ thống sử dụng *Choreography* (các service tự do nghe gọi qua lại), sau đó chuyển sang **Saga Orchestration** để điều phối quy trình phức tạp, quản trị trạng thái tập trung.

- **`OrderFulfillmentStateMachine` (tại OMS):** Đóng vai trò là Nhạc trưởng (Orchestrator). Nó lưu lại `State` (Trạng thái) hiện tại của quá trình mua hàng và quyết định bước tiếp theo khi nhận các event phản hồi từ Warehouse, Payment.
- **CorrelationId:** Chìa khóa để Saga biết Message trả về thuộc về đơn hàng nào. Trong dự án, ta thiết lập `CorrelationId` chính là `OrderId`. Mọi message đi qua Message Bus **bắt buộc** phải chứa field này để map đúng state.

### Bù trừ (Compensation Matrix):
Nếu một service thất bại sau khi nhiều bước trước đã chạy xong, Saga sẽ điều khiển quá trình *rollback*:
- Gửi lệnh `ReleaseInventoryCommand` về WMS nếu quá trình giao hàng (Route Assignment) thất bại, đòi lại hàng vào kho.
  
---

## 4. Idempotency (Tính luỹ đẳng)

Do cơ chế Outbox và mạng không ổn định, Message Broker thiên về hướng đảm bảo phân phối ít nhất một lần (**At-least-once**). Nghĩa là Consumer có thể nhận **cùng một sự kiện hai lần**.

**Luỹ đẳng:** Thuộc tính đảm bảo rằng dù ta chạy một action nhiều lần, kết quả cuối cùng vẫn giống hệt chạy 1 lần. 
- Warehouse từ chối trừ kho nếu đã xử lý MessageId đó rồi. 
- MassTransit hỗ trợ `Inbox` pattern: lưu lại lịch sử các `MessageId` đã xử lý thành công để tự động skip nếu có sự cố trùng lặp từ Publisher.

### Ví dụ luỹ đẳng tự cài đặt:
```csharp
public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
{
    var existsId = await _db.ProcessedMessages.AnyAsync(m => m.Id == context.MessageId);
    if (existsId) return; // Bỏ qua, đã xử lý!

    // ... Logic trừ kho

    _db.ProcessedMessages.Add(new ProcessedMessage { Id = context.MessageId });
    await _db.SaveChangesAsync(); // Lưu Atomically
}
```

---
*Nắm được bộ 4 khái niệm này (MassTransit, Outbox, Saga, Idempotency) là bạn đã tự tin làm việc với các hệ thống phân tán chịu tải cao thực tế.*
