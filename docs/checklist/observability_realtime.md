# Giám sát & Thông báo Thời gian thực (Observability & Real-time)

Khi hệ thống bị chia nhỏ thành nhiều Microservices, thách thức lớn nhất là làm sao để biết một request đang bị tắc ở đâu và làm sao báo cáo kết quả tức thì cho người dùng.

---

## 1. OpenTelemetry & Jaeger (Distributed Tracing)

Nếu User bấm "Tạo Đơn Hàng" và bị lỗi 500, lỗi đó có thể nằm ở OMS (cổng 5000), hệ thống Auth, RabbitMQ, hoặc WMS (cổng 5001). Để truy vết, dự án sử dụng **OpenTelemetry** kết hợp với giao diện **Jaeger**.

**Cơ chế hoạt động:**
- **TraceId:** Một ID duy nhất được sinh ra khi request chạm vào API Gateway.
- **Span:** Mỗi khi request nhảy sang service khác (OMS $\rightarrow$ RabbitMQ $\rightarrow$ WMS), một "Span" mới được tạo ra ghi lại thời gian thực thi (Start to End).
- Log của mọi Span đều mang chung `TraceId`.
- **Jaeger UI:** Thu thập toàn bộ dữ liệu này và vẽ đồ thị (Waterfall chart) để lập trình viên nhìn xuyên thấu hệ thống. Biết chính xác hàm nào chậm, service nào ném lỗi.

*Note: Để TraceId chạy xuyên qua RabbitMQ không bị đứt đoạn, bắt buộc phải cài package `MassTransit.OpenTelemetry` trên tất cả các dịch vụ có kết nối Message Broker.*

---

## 2. SignalR (WebSockets & Real-time)

Sau khi xử lý bất đồng bộ (ví dụ WMS báo đã nhận hàng vào kho), làm sao để giao diện Web/App của người dùng tự động nhảy sang "Đã Nhập Kho" mà không cần F5 (refresh page)? Dự án dùng **SignalR**.

**Luồng thực thi Real-time:**
1. Trình duyệt của User mở một kết nối WebSocket thường trực tới SignalR Hub (hiện đang đặt tại OMS).
2. Khi kết nối, hệ thống chép `UserId` ra từ Access Token và map với một `ConnectionId` cụ thể.
3. Khi Saga ở OMS nhận được sự kiện `ShipmentReceivedIntegrationEvent` từ WMS, nó cập nhật DB thành `InWarehouse`.
4. Sau khi lưu DB, hệ thống gọi SignalR Hub: Gửi thông báo **đích danh** tới đúng cái `UserId` sở hữu đơn hàng đó.
5. Giao diện người dùng nhận được tín hiệu và tự cập nhật hiển thị.

```csharp
// Ví dụ logic gửi đích danh trong Hub
public async Task SendNotificationToUser(Guid userId, string message)
{
    // Bắn thông báo xuống trực tiếp Client đang giữ UserId này
    await _hubContext.Clients.User(userId.ToString())
        .SendAsync("ReceiveOrderUpdate", message);
}
```

---
*Kết luận: OpenTelemetry giúp hệ thống Không có Góc Tối (Zero Blind Spots) đối với Backend Dev; SignalR giúp UI của Client luôn tự động "Sống động" (Alive) ngay khi có thay đổi trạng thái.*
