using EventBus.Messages.Events;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Ordering.Application.Sagas.OrderFulfillment;

public class OrderFulfillmentStateMachine : MassTransitStateMachine<OrderState>
{
    // --- States (each = "chờ con người hành động") ---
    public State AwaitingPickup { get; private set; } = null!;
    public State PickedUp { get; private set; } = null!;
    public State InWarehouse { get; private set; } = null!;
    public State AwaitingDispatch { get; private set; } = null!;
    public State Dispatched { get; private set; } = null!;
    public State Delivered { get; private set; } = null!;
    public State DeliveryFailed { get; private set; } = null!;
    public State Completed { get; private set; } = null!;

    // --- Events (triggered by human actions via Integration Events) ---
    public Event<OrderCreatedIntegrationEvent> OrderCreated { get; private set; } = null!;
    public Event<ShipmentPickedUpIntegrationEvent> ShipmentPickedUp { get; private set; } = null!;
    public Event<ShipmentReceivedIntegrationEvent> ShipmentReceived { get; private set; } = null!;
    public Event<ShipmentSortedIntegrationEvent> ShipmentSorted { get; private set; } = null!;
    public Event<RouteDispatchedIntegrationEvent> RouteDispatched { get; private set; } = null!;
    public Event<DeliveryCompletedIntegrationEvent> DeliveryCompleted { get; private set; } = null!;
    public Event<DeliveryFailedIntegrationEvent> DeliveryFailedEvent { get; private set; } = null!;

    public OrderFulfillmentStateMachine(ILogger<OrderFulfillmentStateMachine> logger)
    {
        InstanceState(x => x.CurrentState);

        // --- Correlation: OrderId = CorrelationId xuyên suốt ---
        Event(() => OrderCreated, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => ShipmentPickedUp, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => ShipmentReceived, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => ShipmentSorted, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => RouteDispatched, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => DeliveryCompleted, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => DeliveryFailedEvent, x => x.CorrelateById(m => m.Message.OrderId));

        // =====================================================
        // FLOW: Mỗi transition = 1 con người ở ngoài đời hành động
        // =====================================================

        // Step 1: Consignor tạo đơn → Saga khởi tạo → ĐỢI shipper lấy hàng
        Initially(
            When(OrderCreated)
                .Then(context =>
                {
                    logger.LogInformation("Saga: Order {OrderId} created with Waybill {Waybill}", 
                        context.Message.OrderId, context.Message.WaybillCode);
                    context.Saga.OrderId = context.Message.OrderId;
                    context.Saga.ConsignorId = context.Message.ConsignorId;
                    context.Saga.WaybillCode = context.Message.WaybillCode;
                    context.Saga.CodAmount = context.Message.CodAmount;
                })
                .TransitionTo(AwaitingPickup)
        );

        // Step 2: 👤 Shipper scan lấy hàng → ĐỢI hàng về kho
        During(AwaitingPickup,
            When(ShipmentPickedUp)
                .Then(context =>
                {
                    logger.LogInformation("Saga: 👤 Shipper {Driver} picked up Order {OrderId}", 
                        context.Message.DriverId, context.Message.OrderId);
                    context.Saga.PickupDriverId = context.Message.DriverId;
                })
                .TransitionTo(PickedUp)
        );

        // Step 3: 👤 Nhân viên kho scan nhận → ĐỢI phân loại
        During(PickedUp,
            When(ShipmentReceived)
                .Then(context =>
                {
                    logger.LogInformation("Saga: 👤 Warehouse {WH} received Order {OrderId}", 
                        context.Message.WarehouseId, context.Message.OrderId);
                    context.Saga.WarehouseId = context.Message.WarehouseId;
                })
                .TransitionTo(InWarehouse)
        );

        // Step 4: 👤 Nhân viên sorted → ĐỢI quản lý duyệt tuyến
        During(InWarehouse,
            When(ShipmentSorted)
                .Then(context =>
                {
                    logger.LogInformation("Saga: 👤 Order {OrderId} sorted to Warehouse {WH}", 
                        context.Message.OrderId, context.Message.DestinationWarehouseId);
                    context.Saga.DestinationWarehouseId = context.Message.DestinationWarehouseId;
                })
                .TransitionTo(AwaitingDispatch)
        );

        // Step 5: 👤 Quản lý assign tài xế → ĐỢI tài xế giao
        During(AwaitingDispatch,
            When(RouteDispatched)
                .Then(context =>
                {
                    logger.LogInformation("Saga: 👤 Order {OrderId} dispatched to Driver {Driver}", 
                        context.Message.OrderId, context.Message.DriverId);
                    context.Saga.DeliveryDriverId = context.Message.DriverId;
                    context.Saga.RouteId = context.Message.RouteId;
                })
                .TransitionTo(Dispatched)
        );

        // Step 6: 👤 Tài xế → Giao thành công HOẶC thất bại
        During(Dispatched,
            When(DeliveryCompleted)
                .Then(context =>
                {
                    logger.LogInformation("Saga: ✅ Order {OrderId} delivered! POD: {Pod}", 
                        context.Message.OrderId, context.Message.ProofOfDeliveryUrl);
                    context.Saga.ProofOfDeliveryUrl = context.Message.ProofOfDeliveryUrl;
                    context.Saga.DeliveryAttempts++;
                })
                .TransitionTo(Completed)
                .Finalize(),

            When(DeliveryFailedEvent)
                .Then(context =>
                {
                    logger.LogWarning("Saga: ❌ Order {OrderId} delivery failed (Attempt {N}): {Reason}", 
                        context.Message.OrderId, context.Message.AttemptNumber, context.Message.Reason);
                    context.Saga.FailureReason = context.Message.Reason;
                    context.Saga.DeliveryAttempts = context.Message.AttemptNumber;
                })
                .TransitionTo(DeliveryFailed)
        );

        // Step 7: Failed → có thể re-dispatch (giao lại)
        During(DeliveryFailed,
            When(RouteDispatched)
                .Then(context =>
                {
                    logger.LogInformation("Saga: 🔄 Order {OrderId} re-dispatched to Driver {Driver} (retry)", 
                        context.Message.OrderId, context.Message.DriverId);
                    context.Saga.DeliveryDriverId = context.Message.DriverId;
                    context.Saga.RouteId = context.Message.RouteId;
                })
                .TransitionTo(Dispatched)
        );

        SetCompletedWhenFinalized();
    }
}
