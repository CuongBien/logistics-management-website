using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inbound.Queries.GetInboundReceiptsList;

public record GetInboundReceiptsListQuery(string OperatorSub) : IRequest<Result<List<InboundReceiptDto>>>;

public class InboundReceiptDto
{
    public Guid Id { get; set; }
    public string ReceiptNo { get; set; } = default!;
    public string OrderId { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public List<InboundReceiptLineDto> Lines { get; set; } = new();
}

public class InboundReceiptLineDto
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = default!;
    public int ExpectedQuantity { get; set; }
    public int ReceivedQuantity { get; set; }
}

public class GetInboundReceiptsListQueryHandler : IRequestHandler<GetInboundReceiptsListQuery, Result<List<InboundReceiptDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetInboundReceiptsListQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<InboundReceiptDto>>> Handle(GetInboundReceiptsListQuery request, CancellationToken cancellationToken)
    {
        var opProfile = await _context.OperatorProfiles
            .FirstOrDefaultAsync(p => p.OperatorSub == request.OperatorSub, cancellationToken);

        var query = _context.InboundReceipts
            .Include(r => r.Lines)
            .AsQueryable();

        var isAdmin = request.OperatorSub == "e8426038-ce83-4e21-a754-f1834a77267e" || 
                      (opProfile != null && (opProfile.DisplayName == "admin" || opProfile.OperatorSub == "e8426038-ce83-4e21-a754-f1834a77267e"));

        if (isAdmin)
        {
            // Admin sees all receipts
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
            // fallback: return empty if not found
            return Result<List<InboundReceiptDto>>.Success(new List<InboundReceiptDto>());
        }

        var receipts = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        var result = receipts.Select(r => new InboundReceiptDto
        {
            Id = r.Id,
            ReceiptNo = r.ReceiptNo,
            OrderId = $"ORD-{r.OrderId.ToString().Substring(0, 8).ToUpper()}-OMS",
            Status = r.Status.ToString(),
            CreatedAt = r.CreatedAt,
            Lines = r.Lines.Select(l => new InboundReceiptLineDto
            {
                Id = l.Id,
                Sku = l.Sku,
                ExpectedQuantity = l.ExpectedQuantity,
                ReceivedQuantity = l.ReceivedQuantity
            }).ToList()
        }).ToList();

        return Result<List<InboundReceiptDto>>.Success(result);
    }
}
