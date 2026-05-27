using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Errors;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Inventory.Commands.Replenishment;

public record GenerateReplenishmentTasksCommand(
    string TenantId,
    Guid WarehouseId,
    string OperatorId) : IRequest<Result<List<Guid>>>;

public sealed class GenerateReplenishmentTasksCommandHandler : IRequestHandler<GenerateReplenishmentTasksCommand, Result<List<Guid>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<GenerateReplenishmentTasksCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    // Hardcoded for demo/simplicity based on user input
    private const int MinThreshold = 50;
    private const int ReplenishQty = 100;

    public GenerateReplenishmentTasksCommandHandler(IApplicationDbContext context, ILogger<GenerateReplenishmentTasksCommandHandler> logger, IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<List<Guid>>> Handle(GenerateReplenishmentTasksCommand request, CancellationToken cancellationToken)
    {
        if (!await _authService.HasPermissionAsync(request.OperatorId, request.WarehouseId, null, "inventory:replenish", cancellationToken))
            return Result<List<Guid>>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inventory:replenish'."));

        // 1. Find all items in 'Picking' zones that are below threshold
        var pickingItemsQuery = from i in _context.InventoryItems
                                join b in _context.Bins on i.BinId equals b.Id
                                join z in _context.Zones on b.ZoneId equals z.Id
                                where i.TenantId == request.TenantId
                                   && i.WarehouseId == request.WarehouseId
                                   && z.ZoneType == ZoneType.Picking.ToString()
                                   && i.QuantityOnHand < MinThreshold
                                select new { Item = i, Bin = b, Zone = z };

        var pickingItems = await pickingItemsQuery.ToListAsync(cancellationToken);

        var newTasks = new List<ReplenishmentTask>();

        foreach (var pInfo in pickingItems)
        {
            var pItem = pInfo.Item;

            // Check if there's already a pending replenishment for this Bin & SKU
            bool hasPendingTask = await _context.ReplenishmentTasks
                .AnyAsync(t => t.DestinationBinId == pItem.BinId && t.Sku == pItem.Sku 
                            && (t.Status == ReplenishmentTaskStatus.Pending || t.Status == ReplenishmentTaskStatus.InProgress), cancellationToken);

            if (hasPendingTask) continue;

            // 2. Find a source bin in 'Storage' zone with enough qty
            var sourceItemQuery = from i in _context.InventoryItems
                                  join b in _context.Bins on i.BinId equals b.Id
                                  join z in _context.Zones on b.ZoneId equals z.Id
                                  where i.TenantId == request.TenantId
                                     && i.WarehouseId == request.WarehouseId
                                     && i.Sku == pItem.Sku
                                     && z.ZoneType == ZoneType.Storage.ToString()
                                     && (i.QuantityOnHand - i.ReservedQty) >= ReplenishQty
                                  select new { Item = i, Bin = b };

            var sourceInfo = await sourceItemQuery.FirstOrDefaultAsync(cancellationToken);

            if (sourceInfo != null)
            {
                var task = new ReplenishmentTask(
                    request.TenantId, 
                    request.WarehouseId, 
                    pItem.Sku, 
                    sourceInfo.Bin.Id, 
                    pItem.BinId, 
                    ReplenishQty);
                newTasks.Add(task);
            }
        }

        if (newTasks.Any())
        {
            _context.ReplenishmentTasks.AddRange(newTasks);
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Generated {Count} Replenishment Tasks for warehouse {WarehouseId}", newTasks.Count, request.WarehouseId);
        }

        return Result<List<Guid>>.Success(newTasks.Select(x => x.Id).ToList());
    }
}
