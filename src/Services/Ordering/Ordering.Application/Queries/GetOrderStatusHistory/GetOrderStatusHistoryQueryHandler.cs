using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;

namespace Ordering.Application.Queries.GetOrderStatusHistory;

public record GetOrderStatusHistoryQuery(Guid OrderId) : IRequest<Result<IReadOnlyCollection<OrderStatusHistoryDto>>>;

public record OrderStatusHistoryDto(
    Guid OrderId,
    string TenantId,
    string StatusFrom,
    string StatusTo,
    DateTime ChangedAtUtc,
    string Source,
    string? Reason,
    string? ChangedByOperatorId,
    string? CorrelationId);

public sealed class GetOrderStatusHistoryQueryHandler
    : IRequestHandler<GetOrderStatusHistoryQuery, Result<IReadOnlyCollection<OrderStatusHistoryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderStatusHistoryQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<IReadOnlyCollection<OrderStatusHistoryDto>>> Handle(
        GetOrderStatusHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var exists = await _context.Orders
            .AsNoTracking()
            .AnyAsync(x => x.Id == request.OrderId, cancellationToken);
        if (!exists)
        {
            return Result<IReadOnlyCollection<OrderStatusHistoryDto>>.Failure(
                new Error("Order.NotFound", $"Order with Id {request.OrderId} was not found."));
        }

        var rows = await _context.OrderStatusHistories
            .AsNoTracking()
            .Where(x => x.OrderId == request.OrderId)
            .OrderBy(x => x.ChangedAtUtc)
            .Select(x => new OrderStatusHistoryDto(
                x.OrderId,
                x.TenantId,
                x.StatusFrom,
                x.StatusTo,
                x.ChangedAtUtc,
                x.Source,
                x.Reason,
                x.ChangedByOperatorId,
                x.CorrelationId))
            .ToListAsync(cancellationToken);

        return Result<IReadOnlyCollection<OrderStatusHistoryDto>>.Success(rows);
    }
}
