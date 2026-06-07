using Logistics.Core;
using Ordering.Domain.Enums;
using Ordering.Domain.Events;
using Ordering.Domain.Errors;
using Ordering.Domain.ValueObjects;

namespace Ordering.Domain.Entities;

public class Order : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerIdInternal { get; private set; } = default!;
    public string ConsignorId { get; private set; } = default!;  // Người gửi (Shop/Vendor)
    public string? ExternalReference { get; private set; }
    public Consignee Consignee { get; private set; } = default!;  // Người nhận
    public string WaybillCode { get; private set; } = default!;   // Mã vận đơn (auto-gen)
    public OrderStatus Status { get; private set; }
    public decimal CodAmount { get; private set; }    // Tiền thu hộ (COD)
    public decimal ShippingFee { get; private set; }  // Phí vận chuyển
    public decimal Weight { get; private set; }       // Trọng lượng (kg)
    public string? Note { get; private set; }         // Ghi chú giao hàng
    public OrderType Type { get; private set; } = OrderType.Parcel;
    public FulfillmentMode Fulfillment { get; private set; } = FulfillmentMode.Pickup;
    
    public DateTime CreatedAt { get; private set; }
    public DateTime? LastModifiedAt { get; private set; }

    /// <summary>JWT sub or null when created outside operator context (system).</summary>
    public string? CreatedByOperatorId { get; private set; }

    /// <summary>Last operator who persisted a change; null when system context.</summary>
    public string? UpdatedByOperatorId { get; private set; }

    // Navigation
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public void AddItem(Guid skuId, string skuCode, int quantity, decimal price = 0)
    {
        var item = new OrderItem(skuId, quantity, price);
        item.SetSkuCode(skuCode);
        _items.Add(item);
    }

    // Tracking fields populated by human actions
    public string? PickupDriverId { get; private set; }
    public string? WarehouseId { get; private set; }
    public string? DestinationWarehouseId { get; private set; }
    public string? DeliveryDriverId { get; private set; }
    public string? RouteId { get; private set; }
    public string? ProofOfDeliveryUrl { get; private set; }
    public string? FailureReason { get; private set; }
    public int DeliveryAttempts { get; private set; }

    /// <summary>
    /// Not persisted: consumed by ApplicationDbContext when writing OrderStatusHistory rows.
    /// </summary>
    public string? LastTransitionReason { get; private set; }

    // EF Core
    private Order() { }

    // Keep CustomerId as a computed alias for backward compatibility in queries
    public string CustomerId => ConsignorId;

    /// <summary>
    /// Factory: Consignor tạo đơn gửi hàng
    /// </summary>
    public static Result<Order> Create(
        string tenantId,
        string consignorId,
        Consignee consignee,
        decimal codAmount,
        decimal shippingFee,
        decimal weight,
        string? note = null,
        OrderType type = OrderType.Parcel,
        FulfillmentMode fulfillment = FulfillmentMode.Pickup,
        string? sourceWarehouseCode = null,
        string? consignorCity = null,
        string? consignorAddress = null)
    {
        if (codAmount < 0)
            return Result<Order>.Failure(DomainErrors.Order.InvalidCodAmount);
        if (weight <= 0)
            return Result<Order>.Failure(DomainErrors.Order.InvalidWeight);

        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            CustomerIdInternal = consignorId,
            ConsignorId = consignorId,
            Consignee = consignee,
            WaybillCode = GenerateWaybillCode(),
            Status = OrderStatus.New,
            CodAmount = codAmount,
            ShippingFee = shippingFee,
            Weight = weight,
            Note = note,
            Type = type,
            Fulfillment = fulfillment,
            CreatedAt = DateTime.UtcNow,
            DeliveryAttempts = 0
        };

        order.AddDomainEvent(new OrderCreatedDomainEvent(
            order.Id, consignorId, order.WaybillCode, codAmount, shippingFee, (int)type, (int)fulfillment, sourceWarehouseCode, consignorCity, consignorAddress));

        return Result<Order>.Success(order);
    }

    public Result SetInWarehouseDirectly()
    {
        if (Status != OrderStatus.New)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.InWarehouse)));

        Status = OrderStatus.InWarehouse;
        LastModifiedAt = DateTime.UtcNow;
        return Result.Success();
    }

    /// <summary>
    /// Hệ thống tự confirm sau khi validate → AwaitingPickup
    /// </summary>
    public Result Confirm()
    {
        if (Status == OrderStatus.AwaitingPickup) return Result.Success();
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
        if (Status == OrderStatus.PickedUp) return Result.Success();
        if (Status != OrderStatus.AwaitingPickup && Status != OrderStatus.New)
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
        if (Status == OrderStatus.InWarehouse) return Result.Success();
        // Allow multi-hop: PickedUp, AwaitingInbound, AwaitingDispatch, or New (for drop-off) -> InWarehouse
        if (Status != OrderStatus.PickedUp && Status != OrderStatus.AwaitingInbound && Status != OrderStatus.AwaitingDispatch && Status != OrderStatus.New)
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
    public Result MarkSorted(string destinationWarehouseId)
    {
        if (Status == OrderStatus.AwaitingDispatch) return Result.Success();
        if (Status != OrderStatus.InWarehouse)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.AwaitingDispatch)));

        DestinationWarehouseId = destinationWarehouseId;
        Status = OrderStatus.AwaitingDispatch;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderSortedDomainEvent(Id, destinationWarehouseId));
        return Result.Success();
    }

    /// <summary>
    /// 👤 Quản lý duyệt tuyến + assign tài xế giao
    /// </summary>
    public Result MarkDispatched(string driverId, string routeId)
    {
        if (Status == OrderStatus.Dispatched) return Result.Success();
        if (Status != OrderStatus.AwaitingDispatch && Status != OrderStatus.Failed)
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
        if (Status == OrderStatus.Delivered) return Result.Success();
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
        if (Status == OrderStatus.Failed) return Result.Success();
        if (Status != OrderStatus.Dispatched && Status != OrderStatus.Delivering)
            return Result.Failure(DomainErrors.Order.InvalidTransition(Status.ToString(), nameof(OrderStatus.Failed)));

        FailureReason = reason;
        DeliveryAttempts++;
        LastTransitionReason = reason;
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
        return CancelWithReason(null);
    }

    /// <summary>
    /// Hủy đơn với lý do (optional) cho OrderStatusHistory.
    /// </summary>
    public Result CancelWithReason(string? cancellationReason)
    {
        if (Status >= OrderStatus.Dispatched && Status != OrderStatus.Failed)
            return Result.Failure(DomainErrors.Order.CannotCancel);

        LastTransitionReason = cancellationReason;
        Status = OrderStatus.Cancelled;
        LastModifiedAt = DateTime.UtcNow;

        AddDomainEvent(new OrderCancelledDomainEvent(Id));
        return Result.Success();
    }

    public void ClearLastTransitionReasonAfterHistoryWritten()
    {
        LastTransitionReason = null;
    }

    // --- Helpers ---

    public void SetExternalReference(string externalReference)
    {
        ExternalReference = externalReference;
    }

    private static string GenerateWaybillCode()
    {
        var timestamp = DateTime.UtcNow.ToString("yyMMddHHmmss");
        var random = Random.Shared.Next(1000, 9999);
        return $"LMS{timestamp}{random}";
    }
}
