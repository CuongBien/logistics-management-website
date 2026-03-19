# Bài 13: Con Mắt Thần Mọi Máy Chủ (OpenTelemetry & Jaeger)

Khi hệ thống chỉ có 1 cục (Monolith), nếu Lỗi $\rightarrow$ Mở con vps lên gõ `tail -f logs.txt` là thấy ngay bug nằm dòng bao nhiêu.

Nhưng giờ team chúng ta đã "chơi lớn" lên Microservices. 1 Yêu cầu của user đi ngang qua `YARP -> OMS -> RabbitMQ -> WMS`.
- Nếu Yêu cầu bị chết giữa chừng, tao làm sao biết nó chết ở WMS hay đang kẹt ở RabbitMQ? 
- Mở `logs.txt` của 4 con server lên dò từng dòng (trong khi lúc đó có hàng triệu người đang mua sắm)? Dò kiểu gì?

Vũ khí tối thượng của team: **OpenTelemetry (Chuẩn giám sát Viễn đo toàn cầu) kết hợp giao diện Jaeger.**

---

## 👁️ 1. Bản Đồ Tracing (Truy Dấu Tội Phạm)

Hiểu nôm na:
1. Khi khách vác mặt tới cửa **YARP**, YARP lén in lên lưng ông khách 1 cái mã số định danh: **`TraceId`**.
2. Ông khách đi qua cổng **OMS**, hệ thống ghi sổ: `TraceId đó, ở OMS mất 200 miliseconds` (Cái gạch đầu dòng 200ms này gọi là 1 **`Span`**).
3. OMS đẩy 1 cục tin nhắn sang **WMS** thông qua RabbitMQ. Thằng MassTransit rất Tinh Ranh, nó lén nhét cái dòng chữ `TraceId` kia vào cục tin nhắn.
4. WMS bóc cục tin nhắn ra, thấy lưng gói quà có `TraceId`. Nó quét tiếp: `TraceId này nằm ở WMS để Insert DB mất 50ms` (Thêm 1 **`Span`** nữa).

> **Kết quả:** Mở Giao diện Jaeger lên, gõ cái `TraceId` đó vào. Bạn sẽ thấy nguyên 1 cái Sơ đồ Thác Nước (Waterfall). Đỏ lòm ở đâu là biết ông khách chết ở đó!

---

## 🛠️ 2. Cài Đặt Không Cần Code Bằng OpenTelemetry

Sự bá đạo trường phái OpenTelemetry của .NET nằm ở rải rác các gói (Nuget Packages) "Ăn bám". Tức là KHÔNG cần viết code `Stopwatch` để đếm thời gian từng hàm, bạn cài cái thư viện giám sát vào là nó tự bám vào nhịp thở của hệ thống C#.

**Cài đặt các "Máy gắn chip theo dõi" ở `Program.cs`:**
```csharp
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

// Đặt tên App để biết số liệu này do ai báo về (Cực rành mạch)
var resourceBuilder = ResourceBuilder.CreateDefault()
    .AddService("OMS.Api", serviceVersion: "1.0.0");

builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder =>
    {
        tracerProviderBuilder
            .SetResourceBuilder(resourceBuilder)
            
            // 1. Máy bám Controller: Theo dõi khách thọt vào HTTP (HTTP In)
            .AddAspNetCoreInstrumentation()
            
            // 2. Máy bám Http Client: Theo dõi lúc C# đi gọi API ngoài (HTTP Out)
            .AddHttpClientInstrumentation()
            
            // 3. BẮT BUỘC CÓ: Máy bám Entity Framework. Coi xem câu lệnh SQL tốn bao nhiêu milli-giây!
            .AddEntityFrameworkCoreInstrumentation(opt => 
            {
                opt.SetDbStatementForText = true; // In thẳng câu Query SQL lên màn hình cho ae đọc
            })
            
            // 4. Máy bám MassTransit (RabbitMQ)
            .AddSource("MassTransit")

            // KHÚC CUỐI: Sau khi thu thập một đống Sổ Ghi Chép, gom lại gói ném sang Server Jaeger
            .AddOtlpExporter(opt => 
            {
                // Địa chỉ Docker của Jaeger (Port mặc định OTLP gộp vào là 4317)
                opt.Endpoint = new Uri("http://localhost:4317"); 
            });
    });
```

---

## 🔦 3. Chuyện Gì Xảy Ra Nếu Mất Mạng Jaeger?

- *Câu hỏi:* Ủa nếu server chứa con mắt thần Jaeger mà Sập, thì API của team có sập theo không?
- *Trả lời:* **KHÔNG.** `AddOtlpExporter` thiết kế ở dạng Fire-n-Forget (Gửi trong âm thầm, chạy ngầm). Nếu đường truyền Jaeger sập, OpenTelemetry rớt số liệu xuống cống, Service `OMS` của bạn vẫn bán hàng như bình thường (chỉ là kĩ thuật viên sẽ bị mù đường, không bắt pan lỗi được thôi).

## 🚀 4. Xem Log Trực Quay Xịn Thế Nào?

Khi chạy hệ thống bẳng Docker Compose (với dịch vụ `jaeger: all-in-one`), bạn mở trình duyệt:
`http://localhost:16686`

Trong đó có hẳn một bộ máy dò tìm (Search). 
Ví dụ: Lọc ra toàn bộ các giao dịch trên Web **Thất bại** (`Error = True`), và thời gian kéo dài quá **1 giây**. Bạn sẽ lọc ra được đúng 5 giao dịch lag nhất ngày, bấm vô là thấy ngay câu Query Database NGU HỌC nào làm treo hệ thống.

✅ **Chốt Bài 13:** Bất kỳ Junior nào nắm được khái niệm rễ gốc (Tracing, TraceId, Span, OpenTelemetry) thì con đường lên Mid/Senior DevOps coi như đã thành đạo một nửa. Giờ có dính bug ngầm (Memory leak, Deadlock database), mở Thác Nước Tracing lên là lộ nguyên hình thủ phạm! 

Qua bài cuối cùng mang tính Nghệ thuật Thị Giác **Bài 14: Bắn Kết Quả Về Frontend bằng SignalR WebSocket**, chốt sổ khóa học Logistics Team!
