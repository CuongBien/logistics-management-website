using Logistics.Core;

namespace Ordering.Domain.Entities;

public class OutboxMessage : Entity<Guid>
{
    public Guid CorrelationId { get; private set; }
    public string Content { get; private set; } = default!;
    public DateTime? SentTime { get; private set; }

    // EF Core
    private OutboxMessage() { }

    public OutboxMessage(Guid correlationId, string content)
    {
        Id = Guid.NewGuid();
        CorrelationId = correlationId;
        Content = content;
    }

    public void MarkAsSent()
    {
        SentTime = DateTime.UtcNow;
    }
}