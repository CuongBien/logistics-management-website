# Bài 8: Saga Orchestration (Nghệ Thuật Nhạc Trưởng)

Nếu một luồng mua hàng cần đi qua 3 service: `OMS (Tạo đơn) => WMS (Trừ kho) => Payment (Trừ tiền)`.
Nếu WMS trừ kho cực kỳ mượt, nhưng Payment lại báo: "Thẻ cạn tiền". Hệ thống sẽ kẹt ở trạng thái lơ lửng: Hàng bị giam trong góc kho, còn Đơn Hàng thì treo hoài.
Ai sẽ là người theo dõi Đơn Hàng này? Ai sẽ đứng ra hét lên với WMS: "Thẻ nó hết tiền rồi, WMS trả hàng lại vô kho cất đi!"?

Câu trả lời là: **Nhạc trưởng (Saga Orchestration)**. 
Chúng ta sử dụng `MassTransit State Machine` nằm ở phía `OMS` để làm Nhạc Trưởng.

---

## 🎼 1. Lập Hồ Sơ Theo Dõi (State Entity)

Muốn làm Nhạc Trưởng, bạn phải có cuốn sổ ghi chép (Lưu ở Database) xem từng bài nhạc (Đơn Hàng) đang hát tới đoạn nào.

**Ví dụ Code - Tạo Entity Trạng Thái trong `OMS.Domain`:**
```csharp
using MassTransit;

public class OrderState : SagaStateMachineInstance
{
    // BẮT BUỘC: ID dùng để MassTransit tìm kiếm cuốn sổ này trên Database. 
    // Mọi người trong team MẶC ĐỊNH lấy cái CorrelationId này GÁN BẰNG ĐÚNG OrderId nhé!
    public Guid CorrelationId { get; set; } 
    
    // Cột lưu chữ: "Created", "InWarehouse", "Completed"
    public string CurrentState { get; set; } = string.Empty; 
    
    // Lưu lại thời khắc bắt đầu
    public DateTime CreatedAt { get; set; }
    
    // Chống Race-condition (như Bài 3 đã nhắc) cho Database
    public int Version { get; set; } 
}
```

---

## 🎹 2. Quy Luật Của Nhạc Trưởng (State Machine)

Đây là nơi bạn chỉ tay năm ngón, vạch ra các cung đường Event.

**Ví dụ Code - Định nghĩa Bộ Não Điều Phối:**
```csharp
// Đặt tại File: OMS.Application/Sagas/OrderFulfillmentStateMachine.cs
public class OrderFulfillmentStateMachine : MassTransitStateMachine<OrderState>
{
    // 1. Khai báo các Trạng Thái (States) có thể xảy ra
    public State Submitted { get; private set; }
    public State InventoryReserved { get; private set; }
    public State Faulted { get; private set; }

    // 2. Khai báo các Lời Nhắn (Events) Nhạc trưởng CHỜ NGHE
    public Event<OrderCreatedIntegrationEvent> OrderCreated { get; private set; }
    public Event<InventoryReservedIntegrationEvent> InventoryReservedEvent { get; private set; }
    public Event<PaymentFailedIntegrationEvent> PaymentFailedEvent { get; private set; }

    public OrderFulfillmentStateMachine()
    {
        // Khai báo cột nào trong DB sẽ hứng chữ CurrentState
        InstanceState(x => x.CurrentState);

        // LIÊN KẾT NHÂN QUẢ (CỰC KỲ QUAN TRỌNG):
        // Khi nghe Event nào bay tới, Nhạc trưởng rút cái Id bên trong Event ra 
        // để dò sổ xưng danh (CorrelationId) ở DB. Nếu không gán cái này, Nhạc trưởng bị mù!
        Event(() => OrderCreated, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => InventoryReservedEvent, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => PaymentFailedEvent, x => x.CorrelateById(m => m.Message.OrderId));

        // ------------------ QUY TRÌNH CHẠY BẮT ĐẦU ------------------

        // BƯỚC 1: KHỞI TẠO
        Initially(
            When(OrderCreated)
                .Then(context => {
                    context.Saga.CreatedAt = DateTime.UtcNow;
                    Console.WriteLine($"[Saga] Mở hồ sơ Đơn Hàng: {context.Saga.CorrelationId}");
                })
                .TransitionTo(Submitted) // Đổi trạng thái trong DB thành Submitted
        );

        // BƯỚC 2: SAU KHI KHO ĐÃ LÀM XONG
        During(Submitted,
            When(InventoryReservedEvent)
                .Then(context => Console.WriteLine($"[Saga] Kho đã giữ hàng thành công!"))
                .TransitionTo(InventoryReserved) // Đổi trạng thái
        );

        // BƯỚC 3: BÙ TRỪ (COMPENSATION) NẾU THẤT BẠI
        During(InventoryReserved,
            When(PaymentFailedEvent)
                .Then(context => Console.WriteLine($"[Saga] Oẳng! Thẻ hết tiền! Hủy mọi thứ!"))
                
                // RA LỆNH NGƯỢC LẠI: Gửi một Command sang RabbitMQ bảo WMS nhả kho ra!
                .Publish(context => new ReleaseInventoryCommand(context.Saga.CorrelationId))
                
                .TransitionTo(Faulted) // Đẩy trạng thái xuống Địa Ngục
        );
    }
}
```

---

## 🔌 3. Cách Setup Dành Phân Bổ Server

1. **State Entity** (`OrderState`) phải được Entity Framework Migrations tạo bảng trong `OMS_DB` (vì OMS làm não).
2. Code `AddSagaStateMachine<OrderFulfillmentStateMachine, OrderState>()` được gắn vào Program.cs của thằng `OMS.Api` cùng chỗ với `AddMassTransit`.
3. Khi bạn làm xong 2 cái trên, RabbitMQ sẽ tự động tạo một cái Queue xịn xò có tên là `order-fulfillment-state-machine`.

✅ **Chốt Bài 8:** 
Saga Orchestration là cách giải quyết triệt để của kỹ thuật **2-Phase Commit (2PC)** cũ kĩ. Nhạc trưởng không ôm đồm lock dữ liệu WMS, nó chỉ LẮNG NGHE. Mọi quy trình đi thuận, hoặc Mọi quy trình quay về HỦY BỎ (Rollback), đều được vạch rõ ràng bằng code C#.
Nhờ file `.cs` State Machine trên, bất kỳ Dev nào nối gót dự án, chỉ cần mở file ra là hiểu CHI TIẾT luồng chảy của cả Tập đoàn Logistics mà không cần vẽ sơ đồ Flowchart rối rắm!
