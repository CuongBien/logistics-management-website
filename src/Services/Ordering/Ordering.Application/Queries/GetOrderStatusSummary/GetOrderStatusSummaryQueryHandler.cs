using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Enums;

namespace Ordering.Application.Queries.GetOrderStatusSummary;

public class GetOrderStatusSummaryQueryHandler : IRequestHandler<GetOrderStatusSummaryQuery, Result<OrderStatusSummaryDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderStatusSummaryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderStatusSummaryDto>> Handle(GetOrderStatusSummaryQuery request, CancellationToken cancellationToken)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var query = _context.Orders.AsNoTracking().Where(o => o.CreatedAt >= thirtyDaysAgo);

        if (!string.IsNullOrWhiteSpace(request.TenantId))
        {
            query = query.Where(o => o.TenantId == request.TenantId);
        }

        if (!string.IsNullOrWhiteSpace(request.WarehouseId))
        {
            query = query.Where(x => x.WarehouseId == request.WarehouseId || x.DestinationWarehouseId == request.WarehouseId);
        }

        var orders = await query
            .Select(o => new { o.Status })
            .ToListAsync(cancellationToken);

        int pending = orders.Count(o => o.Status == OrderStatus.New || o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.AwaitingPickup || o.Status == OrderStatus.AwaitingInbound || o.Status == OrderStatus.AwaitingDispatch);
        int dispatched = orders.Count(o => o.Status == OrderStatus.Dispatched || o.Status == OrderStatus.Delivering);
        int delivered = orders.Count(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Completed);
        int failed = orders.Count(o => o.Status == OrderStatus.Failed);
        int cancelled = orders.Count(o => o.Status == OrderStatus.Cancelled);

        var dto = new OrderStatusSummaryDto(
            pending,
            dispatched,
            delivered,
            failed,
            cancelled
        );

        return Result<OrderStatusSummaryDto>.Success(dto);
    }
}
