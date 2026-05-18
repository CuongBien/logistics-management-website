namespace Warehouse.Application.Features.Outbound.Queries.GetOrderTrackingTimeline;

public class OrderTrackingDto
{
    public Guid OrderId { get; set; }
    public string OrderNo { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime SlaDeadline { get; set; }
    public bool IsSlaBreached { get; set; }
    public List<TimelineEventDto> Timeline { get; set; } = new();
}

public class TimelineEventDto
{
    public DateTime Timestamp { get; set; }
    public string Location { get; set; } = default!;
    public string EventType { get; set; } = default!;
    public string Description { get; set; } = default!;
    public bool IsFuture { get; set; }
}
