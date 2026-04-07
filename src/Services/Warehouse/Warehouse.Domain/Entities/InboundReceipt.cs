using Logistics.Core;

namespace Warehouse.Domain.Entities;

public class InboundReceipt : Entity<Guid>, IAggregateRoot
{
    public Guid OrderId { get; private set; }
    public int Status { get; private set; } // 0=Pending, 1=Received
    public DateTime ReceivedAt { get; private set; }

    // Navigation
    private readonly List<InboundItem> _items = new();
    public IReadOnlyCollection<InboundItem> Items => _items.AsReadOnly();

    // EF Core
    private InboundReceipt() { }

    public InboundReceipt(Guid orderId)
    {
        Id = Guid.NewGuid();
        OrderId = orderId;
        Status = 0; // Pending
    }

    public void MarkReceived()
    {
        Status = 1;
        ReceivedAt = DateTime.UtcNow;
    }

    public void AddItem(InboundItem item)
    {
        _items.Add(item);
    }
}