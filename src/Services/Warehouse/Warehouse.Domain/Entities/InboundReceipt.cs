using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum InboundReceiptStatus
{
    Pending = 0,
    Received = 1
}

public class InboundReceipt : Entity<Guid>, IAggregateRoot
{
    public string TenantId { get; private set; } = default!;
    public string CustomerId { get; private set; } = default!;
    public string? SourceShipmentNo { get; private set; }
    public Guid OrderId { get; private set; }
    public InboundReceiptStatus Status { get; private set; }
    public DateTime? ReceivedAt { get; private set; }

    // Navigation
    private readonly List<InboundItem> _items = new();
    public IReadOnlyCollection<InboundItem> Items => _items.AsReadOnly();

    // EF Core
    private InboundReceipt() { }

    public InboundReceipt(Guid orderId, string tenantId, string customerId, string? sourceShipmentNo)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        TenantId = tenantId;
        CustomerId = customerId;
        SourceShipmentNo = sourceShipmentNo;
        Status = InboundReceiptStatus.Pending;
    }

    public void MarkReceived()
    {
        if (Status == InboundReceiptStatus.Received)
        {
            throw new InvalidOperationException("Inbound receipt is already in Received status.");
        }

        Status = InboundReceiptStatus.Received;
        ReceivedAt = DateTime.UtcNow;
    }

    public void AddItem(InboundItem item)
    {
        _items.Add(item);
    }
}