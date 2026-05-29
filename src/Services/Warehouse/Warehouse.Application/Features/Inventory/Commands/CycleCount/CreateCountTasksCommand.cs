using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Inventory.Commands.CycleCount;

public record CreateCountTasksCommand(
    string TenantId,
    Guid WarehouseId,
    string OperatorId,
    int MaxTasks = 10) : IRequest<Result<List<Guid>>>;

public sealed class CreateCountTasksCommandHandler : IRequestHandler<CreateCountTasksCommand, Result<List<Guid>>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateCountTasksCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public CreateCountTasksCommandHandler(IApplicationDbContext context, ILogger<CreateCountTasksCommandHandler> logger, IOperatorAuthorizationService authService)
    {
        _context = context;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<List<Guid>>> Handle(CreateCountTasksCommand request, CancellationToken cancellationToken)
    {
        if (!await _authService.HasPermissionAsync(request.OperatorId, request.WarehouseId, null, "inventory:count", cancellationToken))
            return Result<List<Guid>>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'inventory:count'."));

        // Generate count tasks for random bins/items
        var inventoryItems = await _context.InventoryItems
            .Where(x => x.WarehouseId == request.WarehouseId && x.TenantId == request.TenantId)
            .OrderBy(x => Guid.NewGuid()) // Random picking for cycle count
            .Take(request.MaxTasks)
            .ToListAsync(cancellationToken);

        if (!inventoryItems.Any())
            return Result<List<Guid>>.Success(new List<Guid>());

        var newTasks = new List<CountTask>();
        foreach (var item in inventoryItems)
        {
            var task = new CountTask(item.TenantId, item.WarehouseId, item.BinId, item.Sku, item.LotNo, item.ExpiryDate, item.QuantityOnHand);
            newTasks.Add(task);
        }

        _context.CountTasks.AddRange(newTasks);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Created {Count} Cycle Count tasks for warehouse {WarehouseId}", newTasks.Count, request.WarehouseId);

        return Result<List<Guid>>.Success(newTasks.Select(x => x.Id).ToList());
    }
}
