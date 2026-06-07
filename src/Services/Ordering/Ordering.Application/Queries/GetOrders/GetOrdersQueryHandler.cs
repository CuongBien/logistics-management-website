using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Application.Queries.GetOrderById;

namespace Ordering.Application.Queries.GetOrders;

public record GetOrdersQuery(
    int Page = 1,
    int PageSize = 10,
    string? TenantId = null,
    string? ConsignorId = null,
    string? Status = null,
    string? Type = null,
    string? Fulfillment = null,
    string? SearchTerm = null,
    string? WarehouseId = null
) : IRequest<Result<PaginatedList<OrderSummaryDto>>>;

public record OrderSummaryDto(
    Guid Id,
    string ConsignorId,
    string WaybillCode,
    string Status,
    string Type,
    string Fulfillment,
    decimal CodAmount,
    decimal ShippingFee,
    decimal Weight,
    DateTime CreatedAt,
    string? WarehouseId,
    string? DestinationWarehouseId,
    string ConsigneeName,
    string ConsigneePhone
);

public class PaginatedList<T>
{
    public List<T> Items { get; }
    public int PageIndex { get; }
    public int TotalPages { get; }
    public int TotalCount { get; }

    public PaginatedList(List<T> items, int count, int pageIndex, int pageSize)
    {
        PageIndex = pageIndex;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
        TotalCount = count;
        Items = items;
    }
}

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, Result<PaginatedList<OrderSummaryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOrdersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PaginatedList<OrderSummaryDto>>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.TenantId))
        {
            query = query.Where(x => x.TenantId == request.TenantId);
        }

        if (!string.IsNullOrWhiteSpace(request.ConsignorId))
        {
            query = query.Where(x => x.ConsignorId == request.ConsignorId);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<Ordering.Domain.Enums.OrderStatus>(request.Status, true, out var status))
        {
            query = query.Where(x => x.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Type) && Enum.TryParse<Ordering.Domain.Enums.OrderType>(request.Type, true, out var type))
        {
            query = query.Where(x => x.Type == type);
        }

        if (!string.IsNullOrWhiteSpace(request.Fulfillment) && Enum.TryParse<Ordering.Domain.Enums.FulfillmentMode>(request.Fulfillment, true, out var fulfillment))
        {
            query = query.Where(x => x.Fulfillment == fulfillment);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.ToLower();
            query = query.Where(x => 
                x.WaybillCode.ToLower().Contains(term) || 
                x.ExternalReference!.ToLower().Contains(term) ||
                x.Consignee.FullName.ToLower().Contains(term) ||
                x.Consignee.Phone.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(request.WarehouseId))
        {
            query = query.Where(x => x.WarehouseId == request.WarehouseId || x.DestinationWarehouseId == request.WarehouseId);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new OrderSummaryDto(
                x.Id,
                x.ConsignorId,
                x.WaybillCode,
                x.Status.ToString(),
                x.Type.ToString(),
                x.Fulfillment.ToString(),
                x.CodAmount,
                x.ShippingFee,
                x.Weight,
                x.CreatedAt,
                x.WarehouseId,
                x.DestinationWarehouseId,
                x.Consignee.FullName,
                x.Consignee.Phone
            ))
            .ToListAsync(cancellationToken);

        var result = new PaginatedList<OrderSummaryDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PaginatedList<OrderSummaryDto>>.Success(result);
    }
}
