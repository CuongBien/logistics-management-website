# Bài 7: Tính Lũy Đẳng (Idempotency) 

Ở bài 6, Outbox Pattern đã dùng mạng giữ liệu bằng cách **"Bắn đi ít nhất 1 lần (At-least-once)"**. Tuy nhiên, do bản chất đường truyền Internet chập chờn, hoặc RabbitMQ gặp quá tải nên không trả về được lệnh `Acknowledge` (Xác nhận đã vứt message).

Hậu quả là RabbitMQ lăng xăng gửi cái Message "Tạo Đơn Hàng #999" tới WMS... tận **3 LẦN**.
Nếu kho WMS cứ ngây ngô nhận 3 lời nhắn và chạy hàm trừ Tồn kho 3 lần, công ty sẽ lỗ sấp mặt.

Đây là lúc ta cần thiết lập tính **LŨY ĐẲNG (Idempotency)** cho hệ thống.

---

## 🪞 1. Khái Niệm Lũy Đẳng Là Gì?

Lũy Đẳng trong kỹ thuật phần mềm mang ý nghĩa: **Dù bạn gọi một API (hoặc sự kiện) 1 lần hay 1000 lần, thì kết quả để lại trên Database hệ thống Y HỆT như chỉ gọi 1 lần.**

- **Hành động KHÔNG lũy đẳng:** Nạp 100K vào tài khoản. (Bấm 3 lần $\rightarrow$ Nạp 300K).
- **Hành động LŨY ĐẲNG:** Cập nhật Avatar của tài khoản bằng Tấm Hình A. (Bấm 3 lần $\rightarrow$ Nó vẫn là Tấm Hình A).

Khi thiết kế Hệ thống phân tán, MỌI LỜI NHẮN (MQ Message) phải được code để **Tiếp thu Lũy Đẳng**.

---

## 🛡️ 2. Cách Chống Lập Thủ Công (Dùng Database)

Cách thô sơ và dễ hiểu nhất (Để team hiểu bản chất): Bất cứ message MQ nào được MassTransit gửi đi đều có 1 cái `MessageId` định danh duy nhất (Guid). Ta tạo 1 bảng rác trong Database để nhớ xem ID nào đã bị "thịt" rồi.

**Ví dụ Code - Tư duy tự code:**
```csharp
public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
{
    var msgId = context.MessageId;

    // 1. Kiểm tra sổ đen (DB) xem ID này xài chưa?
    var isProcessed = await _db.ProcessedMessages.AnyAsync(m => m.Id == msgId);
    if (isProcessed) 
    {
        // Nhắn nhẹ 1 câu và... quay xe, không làm gì cả! IDEMPOTENCY! 
        Console.WriteLine("Cái sự kiện này tôi xử rồi mấy ông ơi. Báo RabbitMQ là DONE đi!");
        return; 
    }

    // 2. Chưa xử lý thì trừ kho WMS...
    var item = await _db.Inventory.FindAsync(context.Message.Sku);
    item.Quantity -= context.Message.Quantity;

    // 3. Đánh dấu vào Sổ Đen & Lưu DB Cùng Lúc! (Dùng chung Transaction đẻ tránh lỗi)
    _db.ProcessedMessages.Add(new ProcessedMessage { Id = msgId });
    await _db.SaveChangesAsync(); 
}
```

---

## 🧙‍♂️ 3. Phép Màu Của MassTransit (Inbox Pattern)

Việc bắt team code hàm kiểm tra `if(isProcessed)` lặp đi lặp lại ở mọi Consumer là xúc phạm sức lao động. May quá, bộ Đôi song sát **Inbox/Outbox** của Entity Framework + MassTransit sinh ra để gánh thay team.

**Bước 1: Setup trong Program.cs (Cực Nhẹ Nhàng)**
Trong Bài 6, chúng ta đã gọi lệnh `AddInboxStateEntity()`. Giờ ta chỉ việc bật nó lên.

```csharp
builder.Services.AddMassTransit(x =>
{
    // ...
    x.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
    {
        o.UsePostgres();
        o.UseBusOutbox(); 

        // CHỈ CẦN THÊM ĐÚNG DÒNG NÀY (Nhận sự kiện qua Inbox)
        // Nó sẽ tự động kiểm tra MessageId xem đã tồn tại trong InboxState chưa. Mọi thứ Tự Động!
        o.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5))); // Cấu hình retry kèm luôn nếu muốn
    });

    x.UsingRabbitMq((context, cfg) => 
    {
        cfg.ReceiveEndpoint("wms-order-created", e =>
        {
            // Bật màng chắn bảo vệ đạn Lũy Đẳng ở cửa ngõ Endpoint
            e.UseEntityFrameworkOutbox<ApplicationDbContext>(context);
            
            e.ConfigureConsumer<OrderCreatedConsumer>(context);
        });
    });
});
```

**Bước 2: Coder cứ viết Logic như chưa từng có cuộc chia ly (Code gọn ơ):**
```csharp
// Đặt tại File: WMS.Application/Consumers/OrderCreatedConsumer.cs
public async Task Consume(ConsumeContext<OrderCreatedIntegrationEvent> context)
{
    // BẠN KHÔNG CẦN VIẾT IF TRÙNG LẶP NỮA!
    // Bạn cứ yên tâm tin tưởng tuyệt đối MassTransit đã chặn trùng từ ngoài cổng.
    
    var item = await _db.Inventory.FindAsync(context.Message.Sku);
    item.Quantity -= context.Message.Quantity;
    
    // SaveChanges sẽ lưu dữ liệu Inventory VÀ lưu luôn cái Thẻ "Ghi Nhớ Inbox" cùng lúc!
    await _db.SaveChangesAsync();
}
```

✅ **Chốt Bài 7 (Sự thật phũ phàng):** Nếu anh em thấy Microservices phức tạp và đòi hỏi quá nhiều chiêu trò (CQRS, MediatR, Outbox, MessageId, Idempotency...), thì đó là vì **Phân Tán Hệ Thống Luôn Đắt Đỏ**. Đừng tưởng xẻ API ra nhiều project là ngầu, nó đi kèm một đống quy luật giữ an toàn!

Tiếp theo Bài 8, anh em sẽ đối mặt với bài toán BÙ TRỪ. Lỡ trừ kho rồi mà Thanh toán thẻ tín dụng bị lỗi (Thẻ Hết Tiền) thì xử lý HỦY KHÍA CẠNH LỊCH SỬ ra sao? Chào mừng đến khóa huấn luyện **Saga Orchestration**!
