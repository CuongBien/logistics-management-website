using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Queries.GetInventoryLedger;

public record GetInventoryLedgerQuery(Guid InventoryItemId) : IRequest<Result<List<InventoryLedgerDto>>>;

public record GetGlobalInventoryLedgerQuery(Guid? WarehouseId = null, string? Sku = null) : IRequest<Result<List<InventoryLedgerDto>>>;

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

public class GetInventoryLedgerHandler : 
    IRequestHandler<GetInventoryLedgerQuery, Result<List<InventoryLedgerDto>>>,
    IRequestHandler<GetGlobalInventoryLedgerQuery, Result<List<InventoryLedgerDto>>>
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

    public async Task<Result<List<InventoryLedgerDto>>> Handle(GetGlobalInventoryLedgerQuery request, CancellationToken cancellationToken)
    {
        var query = _context.InventoryLedgers.AsQueryable();

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(x => x.WarehouseId == request.WarehouseId.Value);
        }

        if (!string.IsNullOrEmpty(request.Sku))
        {
            query = query.Where(x => x.Sku.Contains(request.Sku));
        }

        var ledger = await query
            .OrderByDescending(x => x.OccurredAt)
            .Take(100) // Limit to latest 100 entries for performance
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
