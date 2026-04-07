using Logistics.Core;

namespace Warehouse.Domain.Entities;

public enum InboundReceiptStatus
{
    Pending = 0,
    Received = 1
}

public class InboundReceipt : Entity<Guid>, IAggregateRoot
{
    public Guid OrderId { get; private set; }
    public InboundReceiptStatus Status { get; private set; }
    public DateTime? ReceivedAt { get; private set; }

    // Navigation
    private readonly List<InboundItem> _items = new();
    public IReadOnlyCollection<InboundItem> Items => _items.AsReadOnly();

    // EF Core
    private InboundReceipt() { }

    public InboundReceipt(Guid orderId)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        Status = InboundReceiptStatus.Pending;
    }

    public void MarkReceived()
    {
        Status = InboundReceiptStatus.Received;
        ReceivedAt = DateTime.UtcNow;
    }

    public void AddItem(InboundItem item)
    {
        _items.Add(item);
    }
}