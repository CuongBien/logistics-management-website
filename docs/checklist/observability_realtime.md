# 🕵️‍♂️ Giám sát & Thông báo Real-time (Sống còn)

Càng chia nhiều Microservices, bug càng "láu cá" lẩn trốn. Việc thiết lập trạm phát "Telemetrics" (Viễn trắc) là điều kiện bắt buộc trước khi lên Production (và ngay cả khi báo cáo tiến độ Sprint).

---

## 1. OpenTelemetry & Jaeger (Tia XQ)

### Khái niệm cốt lõi:
- **Trace:** Toàn bộ vòng đời của 1 Request (Từ User click $\rightarrow$ Request DB $\rightarrow$ Bắn RabbitMQ).
- **Span:** Mỗi bước nhỏ trong Trace. Nó đo thời gian Start -> End.
- Mọi thành viên phải đảm bảo cài 3 package NuGet: `OpenTelemetry.Extensions.Hosting`, `OpenTelemetry.Instrumentation.AspNetCore`, `OpenTelemetry.Instrumentation.Http`. (Đối với Service nào có DB thì cài thêm `Npgsql`, Service có event thì thêm `MassTransit`).

### Setup Code (Trong Program.cs):
```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(res => res.AddService("OMS.Api"))
    .WithTracing(tracing =>
    {
        tracing.AddAspNetCoreInstrumentation() // Bắt TraceId từ HTTP Request
               .AddHttpClientInstrumentation()   // Truyền TraceId đi khi gọi HttpClient sang service khác
               .AddEntityFrameworkCoreInstrumentation() // Móc vào EF Core xem câu lệnh SQL tốn bao nhiêu ms
               .AddSource("MassTransit") // CỰC QUAN TRỌNG: Gửi TraceId chui qua hệ thống RabbitMQ
               .AddOtlpExporter(opts => opts.Endpoint = new Uri("http://localhost:4317")); // Bắn lên Jaeger
    });
```
**Chỉ với đoạn code trên**, khi bug 500 ném ra báo "Lỗi khi lưu DB", bạn chỉ cần có `TraceId` copy vào giao diện web Jaeger sẽ thấy màu đỏ báo chính xác dòng nào (Span nào) ném ra Error.

---

## 2. SignalR (Đẩy Real-time cho UI)

Các bạn làm Frontend / Mobile App rất thích điều này: Không cần F5 lại trang Web để cập nhật kiện hàng vừa tạo xong. Cứ đợi đó đài mẹ bắn dữ liệu về qua WebSockets.

### Vấn đề Xác thực (Authentication):
Vì Browser (WebSockets) không thể thiết lập Header Authorization (`Bearer xxx`) dễ dàng như AJAX, ta phải truyền JWT lẩn qua chuỗi QueryString khi gọi SignalR.

**Xử lý trong ASP.NET Core API Middleware:**
```csharp
// Đính kèm Middleware đọc JWT từ Query
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // ... (Configs OIDC Keycloak như bình thường) ...
        
        // Móc thêm Event bắt Access_token từ URL
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                // Nếu gọi đường dẫn bắt đầu bằng /hubs và mang theo Token
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken; // Set Token hợp quy
                }
                return Task.CompletedTask;
            }
        };
    });
```

### Xử lý Hub & Gửi đích danh:
Hub không cần viết nhiều, để rỗng cũng được (chủ yếu là Gateway nhận Connection).
Thằng gửi thực sự là Event Handler ở phía Backend (Ví dụ: `OrderFulfillmentStateMachine`).
```csharp
public class OrderStateUpdateHandler
{
    // Inject interface điều khiển Hub từ xa
    private readonly IHubContext<OrderNotificationHub> _hubContext;

    public async Task SendSuccessToCustomer(Guid customerId, string message)
    {
        // Group mặc định của SignalR tự map Connection theo `ClaimTypes.NameIdentifier` (UserId trong JWT)
        await _hubContext.Clients.User(customerId.ToString())
                         .SendAsync("OrderUpdateReceived", message);
    }
}
```
✅ **Checklist Team:** Với cấu trúc 4 layer, chỉ có tầng `Api` (Lớp Presentation) được cài SignalR package. Tầng Application (CQRS Handlers) phải trỏ qua Interface báo cho SignalR đẩy tin nhắn đi, giữ đúng tinh thần **Clean Architecture**.
