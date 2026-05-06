using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;

namespace Ordering.Application.Queries.GetOrderConsignee;

public record GetOrderConsigneeQuery(Guid OrderId) : IRequest<Result<OrderConsigneeDto>>;

public record OrderConsigneeDto(
    Guid OrderId,
    string FullName,
    string Phone,
    string Street,
    string City,
    string State,
    string Country,
    string ZipCode,
    DateTime CreatedAt);

public sealed class GetOrderConsigneeQueryHandler : IRequestHandler<GetOrderConsigneeQuery, Result<OrderConsigneeDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderConsigneeQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<OrderConsigneeDto>> Handle(GetOrderConsigneeQuery request, CancellationToken cancellationToken)
    {
        var row = await _context.OrderConsignees
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.OrderId == request.OrderId, cancellationToken);

        if (row is null)
        {
            return Result<OrderConsigneeDto>.Failure(
                new Error("OrderConsignee.NotFound", $"No OrderConsignee row for order {request.OrderId}."));
        }

        return Result<OrderConsigneeDto>.Success(
            new OrderConsigneeDto(
                row.OrderId,
                row.FullName,
                row.Phone,
                row.Street,
                row.City,
                row.State,
                row.Country,
                row.ZipCode,
                row.CreatedAt));
    }
}
