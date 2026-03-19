# Bài 6: Transactional Outbox (Chống Lệch Data, Mất Mạng)

Cuối bài 5, chúng ta có một câu hỏi sinh tử: **"Hệ thống OMS lưu đơn hàng xong, chuẩn bị vứt Event lên RabbitMQ thì Cúp Điện, Server Tắt Cái Cụp. Chuyện gì xảy ra?"**

Lúc này CSDL của OMS đã có đơn hàng. Nhưng RabbitMQ mãi mãi không nhận được lệnh điều phối. WMS không bao giờ xuất kho, hệ thống không bao giờ giao hàng. Vụ việc chìm vào dĩ vãng, khách hàng chửi rủa vì đã trừ tiền mà hệ thống không đi đơn. Lỗi này gọi là **Dual-Write Problem** (Lỗi ghi 2 nơi).

Giải pháp cứu rỗi thế giới: **Transactional Outbox Pattern** - được tích hợp Tự Động tận răng bởi MassTransit.

---

## 📦 1. Khái Niệm Outbox (Hộp Sẵn Sàng Gửi)

**Nguyên lý ép buộc (Atomic):**
Thay vì gọi thẳng lệnh `Publish` dội vào Internet (sang RabbitMQ), ta đóng gói Message đó thành mã JSON và **LƯU THẲNG VÀO DATABASE MỘT LƯỢT VỚI ĐƠN HÀNG** thông qua tính năng Transaction của Entity Framework.

1. App lưu Bảng `Orders` và Bảng `OutboxMessage` cùng 1 nhịp thở (`SaveChanges()`).
2. Nếu lỗi kết nối DB: Cả Order và Message cùng Rollback (Không có đơn nào bị rớt).
3. Nếu thành công: Một con Worker (chạy ẩn ngầm ngầm) của MassTransit sẽ liên tục rà quét bảng `OutboxMessage`. Thấy tin nào chưa gửi $\rightarrow$ Nó móc lên và Bắn sang RabbitMQ. Nếu bắn mà lúc đó Rabbit sập? Kệ nó, lát nó thử lại. Cứ bao giờ bay an toàn vào RabbitMQ nó mới xóa dòng đó khỏi Database.

Đảm bảo: **At-least-once delivery (Gửi ít nhất một lần, KHÔNG BAO GIỜ MẤT).**

---

## ⚙️ 2. Từng Bước Cấu Hình (Setup Code)

Điều tuyệt vời là bạn KHÔNG cần tự code bảng Outbox, MassTransit đã viết sẵn thư viện móc ngoặc trực tiếp vào EF Core của chúng ta.

**Bước 1: Cài NuGet (Bắt Buộc cho mọi dự án có EF Core + Thư viện nhận/gửi MQ)**
```bash
dotnet add package MassTransit.EntityFrameworkCore
```

**Bước 2: Móc vào DbContext của Service hiện tại (Quân Xương Sống):**
```csharp
// Đặt tại File: OMS.Infrastructure/Persistence/ApplicationDbContext.cs
using MassTransit;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    // Cấu trúc cũ của team...
    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Cực kì quan trọng: Lệnh này bảo EF Core đẻ ra thêm 3 bảng: 
        // OutboxState, OutboxMessage và InboxState cho MassTransit
        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();
    }
}
```
*Lưu ý: Mới cài xong nhớ gõ lệnh `dotnet ef migrations add AddMassTransitOutbox` rồi Chạy Update Database để Postgres có bảng nhé!*

**Bước 3: Móc vào `Program.cs`:**
```csharp
builder.Services.AddMassTransit(x =>
{
    // Báo cho MassTransit biết là dùng EF Core để làm Outbox!
    x.AddEntityFrameworkOutbox<ApplicationDbContext>(o =>
    {
        o.UsePostgres(); // Khai báo rõ loại DB
        
        // UseBusOutbox có tác dụng: Đánh cắp mọi lệnh IPublishEndpoint.Publish() 
        // và dìm nó xuống database thay vì gửi thẳng đi.
        o.UseBusOutbox(); 
    });

    x.UsingRabbitMq((context, cfg) => { ... }); // Râu ria như bài 5
});
```

---

## ⚡ 3. Ở Tầng Xử Lý (HandlerCQRS), Coder Có Cần Làm Gì Khác Không?

**TRẢ LỜI: KHÔNG CẦN THAY ĐỔI MỘT DÒNG CODE NÀO! (Magic)**

Cách dùng ở Bài 5 vẫn giữ HỆT y nguyên:
```csharp
public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken ct)
{
    var order = new Order(request.UserId);
    await _repo.AddAsync(order);

    // Khi gọi lệnh Publish này, do `UseBusOutbox` ở trên, MassTransit tự TẠM TRÚ
    // cái Message này vào DbContext chứa `Order` đang Tracking.
    var msg = new OrderCreatedIntegrationEvent(order.Id, request.UserId);
    await _publishEndpoint.Publish(msg, ct); 
    
    // Câu lệnh chốt hạ SaveChangesAsync bây giờ LƯU CẢ 2 thứ (Order + Outbox JSON) cùng lúc!
    await _uow.SaveChangesAsync(ct); 
    
    return Result.Success(order.Id);
}
```

✅ **Chốt Bài 6:** Quá tuyệt vời phải không? Cơ sở hạ tầng bọc hết phức tạp đi, anh em Coder chỉ việc `Publish()` rồi `SaveChanges()`. 

Nhưng khoan, hệ thống Outbox này thuộc trường phái ném đồ đi "ít nhất một lần" (At-least-once). Điều đó có nghĩa là: **Một cái Message có thể bị chui vô WMS tới tận 2 hoặc 3 LẦN (Nếu mạng chập chờn).** Kho WMS mà bị kêu trừ hàng 2 lần cho 1 mã đơn hàng thì toang! 
Vậy cách thằng Consumer tự bảo vệ mình là gì? Mời team sang **Bài 7: Idempotency (Tính Lũy Đẳng)**.
