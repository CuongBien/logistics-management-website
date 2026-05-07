using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryLedger;

public record GetInventoryLedgerQuery(Guid InventoryItemId) : IRequest<Result<List<InventoryLedgerDto>>>;

public record InventoryLedgerDto(
    Guid Id,
    InventoryTransactionType TransactionType,
    int QuantityChange,
    int BalanceAfter,
    string ReferenceId,
    string? OperatorSub,
    DateTime CreatedAt);

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
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new InventoryLedgerDto(
                x.Id,
                x.TransactionType,
                x.QuantityChange,
                x.BalanceAfter,
                x.ReferenceId,
                x.OperatorSub,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Result<List<InventoryLedgerDto>>.Success(ledger);
    }
}
