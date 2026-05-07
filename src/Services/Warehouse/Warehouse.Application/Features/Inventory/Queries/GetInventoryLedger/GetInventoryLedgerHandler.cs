using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryLedger;

public record GetInventoryLedgerQuery(Guid InventoryItemId) : IRequest<Result<List<InventoryLedgerDto>>>;

public record InventoryLedgerDto(
    Guid Id,
    string Sku,
    Guid WarehouseId,
    Guid BinId,
    InventoryLedgerReason Reason,
    int DeltaQty,
    int BalanceAfter,
    string? ReferenceType,
    string? ReferenceId,
    string? OperatorSub,
    DateTime OccurredAt);

public class GetInventoryLedgerHandler : IRequestHandler<GetInventoryLedgerQuery, Result<List<InventoryLedgerDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetInventoryLedgerHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<InventoryLedgerDto>>> Handle(GetInventoryLedgerQuery request, CancellationToken cancellationToken)
    {
        var ledger = await _context.InventoryLedgers
            .Where(x => x.InventoryItemId == request.InventoryItemId)
            .OrderByDescending(x => x.OccurredAt)
            .Select(x => new InventoryLedgerDto(
                x.Id,
                x.Sku,
                x.WarehouseId,
                x.BinId,
                x.Reason,
                x.DeltaQty,
                x.BalanceAfter,
                x.ReferenceType,
                x.ReferenceId,
                x.OperatorSub,
                x.OccurredAt))
            .ToListAsync(cancellationToken);

        return Result<List<InventoryLedgerDto>>.Success(ledger);
    }
}
