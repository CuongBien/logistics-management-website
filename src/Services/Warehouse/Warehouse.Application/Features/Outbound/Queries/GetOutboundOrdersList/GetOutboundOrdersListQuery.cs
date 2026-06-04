using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Outbound.Queries.GetOutboundOrdersList;

public record GetOutboundOrdersListQuery(string OperatorSub) : IRequest<Result<List<OutboundOrderDto>>>;

public class OutboundOrderDto
{
    public Guid Id { get; set; }
    public string OrderNo { get; set; } = default!;
    public string TenantId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public string Priority { get; set; } = default!;
    public string DestinationAddress { get; set; } = default!;
    public string DestinationCity { get; set; } = default!;
    public DateTime? PlannedShipAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OutboundOrderLineDto> Lines { get; set; } = new();
}

public class OutboundOrderLineDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = default!;
    public int OrderedQuantity { get; set; }
    public int AllocatedQuantity { get; set; }
    public int PickedQuantity { get; set; }
    public int ShippedQuantity { get; set; }
}

public class GetOutboundOrdersListQueryHandler : IRequestHandler<GetOutboundOrdersListQuery, Result<List<OutboundOrderDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetOutboundOrdersListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<OutboundOrderDto>>> Handle(GetOutboundOrdersListQuery request, CancellationToken cancellationToken)
    {
        var opProfile = await _context.OperatorProfiles
            .FirstOrDefaultAsync(p => p.OperatorSub == request.OperatorSub, cancellationToken);

        var query = _context.OutboundOrders
            .Include(r => r.Lines)
            .AsQueryable();

        var isAdmin = request.OperatorSub == "e8426038-ce83-4e21-a754-f1834a77267e" || 
                      (opProfile != null && (opProfile.DisplayName == "admin" || opProfile.OperatorSub == "e8426038-ce83-4e21-a754-f1834a77267e"));

        if (isAdmin)
        {
            // Admin sees all outbound orders
        }
        else if (opProfile != null)
        {
            var assignedWarehouseIds = await _context.OperatorRoleAssignments
                .Where(a => a.OperatorProfileId == opProfile.Id)
                .Select(a => a.WarehouseId)
                .Distinct()
                .ToListAsync(cancellationToken);
            
            query = query.Where(w => assignedWarehouseIds.Contains(w.WarehouseId));
        }
        else
        {
            return Result<List<OutboundOrderDto>>.Success(new List<OutboundOrderDto>());
        }

        var orders = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var result = orders.Select(o => new OutboundOrderDto
        {
            Id = o.Id,
            OrderNo = o.OrderNo,
            TenantId = o.TenantId,
            Status = o.Status.ToString(),
            Priority = o.Priority.ToString(),
            DestinationAddress = o.DestinationAddress,
            DestinationCity = o.DestinationCity,
            PlannedShipAt = o.PlannedShipAt,
            CreatedAt = o.CreatedAt,
            Lines = o.Lines.Select(l => new OutboundOrderLineDto
            {
                Id = l.Id,
                Sku = l.Sku,
                OrderedQuantity = l.RequestedQty,
                AllocatedQuantity = l.ReservedQty,
                PickedQuantity = l.PickedQty,
                ShippedQuantity = l.ShippedQty
            }).ToList()
        }).ToList();

        return Result<List<OutboundOrderDto>>.Success(result);
    }
}
