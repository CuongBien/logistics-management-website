using Logistics.Core;
using MediatR;

namespace Ordering.Application.Queries.GetOrderStatusSummary;

// Role-based / Tenant Isolated
// If TenantId is provided (e.g. from a consignor), it filters by TenantId.
// If TenantId is null (e.g. from an Admin), it queries globally.
public record GetOrderStatusSummaryQuery(string? TenantId = null) : IRequest<Result<OrderStatusSummaryDto>>;

public record OrderStatusSummaryDto(
    int Pending,
    int Dispatched,
    int Delivered,
    int Failed,
    int Cancelled
);
