# Bài 14: Nhịp Đập Thời Gian Thực (SignalR WebSockets)

Từ bài 1 đến 13, chúng ta giải quyết bài toán: Khách hàng Gửi Lệnh -> Server Xử Lý -> Khách hàng Nhận Kết Quả Trả Về (Mô hình Request/Response).

Nhưng trong Logistics, có những thứ không chờ được: Khách vừa đặt đơn xong, **3 ngày sau** bác tài xế mới bấm nút "Đã Giao Hàng Thành Công" cạch một phát.
Làm sao khách đang cầm điện thoại mở App Lazada tự nhiên thấy màn hình nảy lên cái Pop-up: *"Hàng của chóp bu đã tới cửa!"*?

Chẳng lẽ cái App điện thoại phải tự gọi API `GET /api/orders/status` cứ... 1 giây 1 lần liên tục trong 3 ngày? Cách đó **(Polling)** làm chết sập Server.
Giải pháp đỉnh cao: **WebSockets** và thư viện **SignalR** của hệ sinh thái C#. Bắt cái ống nước nối dài từ DB đến thẳng điện thoại người dùng. Vạn kiếp không đứt!

---

## 🔌 1. Ống Nước Bền Vững (Hub Của SignalR)

Nếu bạn gọi API `GET /api/...`, cuộc gọi chỉ tốn 0.1s rồi ngắt kết nối luôn.
Nếu bạn kết nối vào `SignalR Hub`, nó mở ra một đường hầm ngầm TCP 2 chiều mãi mãi cho đến khi bạn tắt App. Server có quyền "Chủ Động" đá thông tin vào ống nước này để dội thẳng vào máy bạn.

**Ví dụ Code - Thiết lập Trạm Trung Chuyển (Hub) ở phía Backend:**
```csharp
// Đặt tại File: OMS.Api/Hubs/NotificationHub.cs
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

// Bắt buộc phải Đăng Nhập (Có Token JWT Keycloak) mới được cắm ống nước vào!
[Authorize] 
public class NotificationHub : Hub<INotificationClient>
{
    // C# 6.0 có Strongly-typed Hub rất ngon
    // Interface này là danh sách CÁC HÀM CỦA FRONTEND mà Backend CÓ QUYỀN ĐÁ KÍCH HOẠT.
    public interface INotificationClient
    {
        // Khi C# gọi hàm này, cái hàm "ReceiveAlert" bên code Javascript chữ nhận!
        Task ReceiveAlert(string message, string type);
    }
}
```

---

## 🎯 2. Gửi Thẳng Đích Danh Không Đi Lạc (User Id)

Cái hay nhất của SignalR bọc chung với JWT (Bài 10) là: SignalR sẽ tự móc cái `UserId` bên trong Token JWT ra để lập danh sách sổ tay. Nên khi bạn vẩy một tin nhắn, bạn phang rầm cái tin đó TỚI ĐÚNG ĐIỆN THOẠI CỦA ÔNG CHỦ MÓN HÀNG.

**Sự kết hợp huỷ diệt: Nhận RabbitMQ -> Phóng thẳng SignalR tới Mobile App**

```csharp
// Đặt tại File: OMS.Application/Consumers/OrderDeliveredConsumer.cs
using MassTransit;
using Microsoft.AspNetCore.SignalR;

public class OrderDeliveredConsumer : IConsumer<OrderDeliveredIntegrationEvent>
{
    // Inject cái ống nước SignalR vào 
    private readonly IHubContext<NotificationHub, NotificationHub.INotificationClient> _hub;

    public OrderDeliveredConsumer(IHubContext<NotificationHub, NotificationHub.INotificationClient> hub)
    {
        _hub = hub;
    }

    public async Task Consume(ConsumeContext<OrderDeliveredIntegrationEvent> context)
    {
        var e = context.Message; // Shipper vừa bấm "Giao xong" -> Message nổ vào đây!
        
        // ... (OMS có thể tự update trạng thái Database của nó ở đây) ...
        
        var alertMessage = $"Đơn hàng {e.OrderId} đã được giao lúc {e.DeliveredAt}. Mời nhận hàng!";
        
        // PHÉP THUẬT NỔ RA: Gửi thẳng tới CÁI ĐIỆN THOẠI ĐANG CẦM ĐÚNG TOKEN CỦA USER ĐÓ
        await _hub.Clients
                  .User(e.CustomerId.ToString()) // Xác định đích danh
                  .ReceiveAlert(alertMessage, "success"); // Bắn tín hiệu!
    }
}
```

---

## 🛠️ 3. Cài Đặt Khởi Động SignalR Tại Program.cs

Cực kì đơn giản, chỉ tốn 3 dòng code đan xen vào `Program.cs`.

```csharp
// 1. Máy bơm
builder.Services.AddSignalR(); 

var app = builder.Build();

// ... các middleware khác ...

// 2. Mở van cho Frontend đút vòi vào (Endpoint này đi trực tiếp ko qua Controller)
app.MapHub<NotificationHub>("/hub/notifications"); 

app.Run();
```

---

## 📱 4. Góc Nhìn Từ Ông Frontend (Vue / React)

Ông FE chỉ việc cài gói NPM `@microsoft/signalr` và viết 5 dòng code JS bấn loạn vì quá dễ:

```javascript
import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://api.logistics.com/oms/hub/notifications", {
        // Kẹp token JWT vào để vào chuồng
        accessTokenFactory: () => localStorage.getItem("my_jwt_token") 
    })
    .withAutomaticReconnect()
    .build();

// Chìa tai ra nghe: NẾU backend đá vào hàm ReceiveAlert, lập tức chạy Code UI
connection.on("ReceiveAlert", (message, type) => {
    alert(`Ting ting! Cảnh báo: ${message}`);
    // Code toast notification xanh đỏ tím vàng...
});

await connection.start(); // Cắm ống nước vào máy bơm Server!
```

✅ **Tuyệt Đỉnh Logistics:** Bây giờ Hệ thống có sức mạnh tự đẩy Data. Bạn có một luồng Real-time rực rỡ từ Back đến Front.
- Giao diện WMS thấy hàng hóa được Pick (lấy khỏi kệ) tụt số liệu Live.
- Shipper bấm chuyển Location, bản đồ khách hàng chớp báo vị trí Shipper Live.
Và với bài toán Real-time này, **Bộ bí kíp 14 Chương Kiến trúc Hệ thống LMS** chính thức đóng lại! Chúc team Logistics chiến đấu bão táp thành công!
