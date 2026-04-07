using Logistics.Core;
using Ordering.Domain.Enums;
using Ordering.Domain.Events;
using Ordering.Domain.Errors;
using Ordering.Domain.ValueObjects;

namespace Ordering.Domain.Entities;

public class Order : Entity<Guid>, IAggregateRoot
{
    public string ConsignorId { get; private set; } = default!;  // Người gửi (Shop/Vendor)
    public Consignee Consignee { get; private set; } = default!;  // Người nhận
    public string WaybillCode { get; private set; } = default!;   // Mã vận đơn (auto-gen)
    public OrderStatus Status { get; private set; }
    public decimal CodAmount { get; private set; }    // Tiền thu hộ (COD)
    public decimal ShippingFee { get; private set; }  // Phí vận chuyển
    public decimal Weight { get; private set; }       // Trọng lượng (kg)
    public string? Note { get; private set; }         // Ghi chú giao hàng
    
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastModifiedAt { get; private set; }

    // Navigation
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    // Tracking fields populated by human actions
    public string? PickupDriverId { get; private set; }
    public string? WarehouseId { get; private set; }
    public string? DestinationHubId { get; private set; }
    public string? DeliveryDriverId { get; private set; }
    public string? RouteId { get; private set; }
    public string? ProofOfDeliveryUrl { get; private set; }
    public string? FailureReason { get; private set; }
    public int DeliveryAttempts { get; private set; }

    // EF Core
    private Order() { }

    // Keep CustomerId as a computed alias for backward compatibility in queries
    public string CustomerId => ConsignorId;

    /// <summary>
    /// Factory: Consignor tạo đơn gửi hàng
    /// </summary>
    public static Result<Order> Create(
        string consignorId,
        Consignee consignee,
        decimal codAmount,
        decimal shippingFee,
        decimal weight,
        string? note = null)
    {
        if (codAmount < 0)
            return Result<Order>.Failure(DomainErrors.Order.InvalidCodAmount);
        if (weight <= 0)
            return Result<Order>.Failure(DomainErrors.Order.InvalidWeight);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            ConsignorId = consignorId,
            Consignee = consignee,
            WaybillCode = GenerateWaybillCode(),
            Status = OrderStatus.New,
            CodAmount = codAmount,
            ShippingFee = shippingFee,
            Weight = weight,
            Note = note,
            CreatedAt = DateTime.UtcNow,
            DeliveryAttempts = 0
        };

        order.AddDomainEvent(new OrderCreatedDomainEvent(
            order.Id, consignorId, order.WaybillCode, codAmount, shippingFee));

        return Result<Order>.Success(order);
    }

    /// <summary>
    /// Hệ thống tự confirm sau khi validate → AwaitingPickup
    /// </summary>
    public Result Confirm()
    {
        if (Status != OrderStatus.New)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.AwaitingPickup)));

        Status = OrderStatus.AwaitingPickup;
        LastModifiedAt = DateTime.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// 👤 Shipper scan barcode → Lấy hàng từ Consignor
    /// </summary>
    public Result MarkPickedUp(string pickupDriverId)
    {
        if (Status != OrderStatus.AwaitingPickup)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.PickedUp)));

        PickupDriverId = pickupDriverId;
        Status = OrderStatus.PickedUp;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderPickedUpDomainEvent(Id, pickupDriverId));
        return Result.Success();
    }

    /// <summary>
    /// 👤 Nhân viên kho scan → Nhận hàng vào kho
    /// </summary>
    public Result MarkInWarehouse(string warehouseId, string receivedBy)
    {
        if (Status != OrderStatus.PickedUp && Status != OrderStatus.AwaitingInbound)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.InWarehouse)));

        WarehouseId = warehouseId;
        Status = OrderStatus.InWarehouse;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderReceivedInWarehouseDomainEvent(Id, warehouseId, receivedBy));
        return Result.Success();
    }

    /// <summary>
    /// 👤 Nhân viên phân loại xong → Sẵn sàng dispatch
    /// </summary>
    public Result MarkSorted(string destinationHubId)
    {
        if (Status != OrderStatus.InWarehouse)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.AwaitingDispatch)));

        DestinationHubId = destinationHubId;
        Status = OrderStatus.AwaitingDispatch;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderSortedDomainEvent(Id, destinationHubId));
        return Result.Success();
    }

    /// <summary>
    /// 👤 Quản lý duyệt tuyến + assign tài xế giao
    /// </summary>
    public Result MarkDispatched(string driverId, string routeId)
    {
        if (Status != OrderStatus.AwaitingDispatch)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.Dispatched)));

        DeliveryDriverId = driverId;
        RouteId = routeId;
        Status = OrderStatus.Dispatched;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderDispatchedDomainEvent(Id, driverId, routeId));
        return Result.Success();
    }

    /// <summary>
    /// 👤 Tài xế xác nhận giao hàng thành công + upload POD
    /// </summary>
    public Result MarkDelivered(string proofOfDeliveryUrl)
    {
        if (Status != OrderStatus.Dispatched && Status != OrderStatus.Delivering)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.Delivered)));

        ProofOfDeliveryUrl = proofOfDeliveryUrl;
        DeliveryAttempts++;
        Status = OrderStatus.Delivered;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderDeliveredDomainEvent(Id, proofOfDeliveryUrl));
        return Result.Success();
    }

    /// <summary>
    /// 👤 Tài xế báo giao thất bại
    /// </summary>
    public Result MarkFailed(string reason)
    {
        if (Status != OrderStatus.Dispatched && Status != OrderStatus.Delivering)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.Failed)));

        FailureReason = reason;
        DeliveryAttempts++;
        Status = OrderStatus.Failed;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderDeliveryFailedDomainEvent(Id, reason, DeliveryAttempts));
        return Result.Success();
    }

    /// <summary>
    /// Hủy đơn (chỉ trước khi Dispatched)
    /// </summary>
    public Result Cancel()
    {
        if (Status >= OrderStatus.Dispatched && Status != OrderStatus.Failed)
            return Result.Failure(DomainErrors.Order.CannotCancel);

        Status = OrderStatus.Cancelled;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderCancelledDomainEvent(Id));
        return Result.Success();
    }

    // --- Helpers ---

    private static string GenerateWaybillCode()
    {
        var timestamp = DateTime.UtcNow.ToString("yyMMddHHmmss");
        var random = Random.Shared.Next(1000, 9999);
        return $"LMS{timestamp}{random}";
    }
}
