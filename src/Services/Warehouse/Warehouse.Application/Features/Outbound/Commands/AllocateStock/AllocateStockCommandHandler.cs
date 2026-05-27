using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using Warehouse.Domain.Errors;
using Warehouse.Domain.Exceptions;

namespace Warehouse.Application.Features.Outbound.Commands.AllocateStock;

public sealed class AllocateStockCommandHandler : IRequestHandler<AllocateStockCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;
    private readonly IInventoryService _inventoryService;
    private readonly ILogger<AllocateStockCommandHandler> _logger;
    private readonly IOperatorAuthorizationService _authService;

    public AllocateStockCommandHandler(
        IApplicationDbContext context,
        IInventoryService inventoryService,
        ILogger<AllocateStockCommandHandler> logger,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _inventoryService = inventoryService;
        _logger = logger;
        _authService = authService;
    }

    public async Task<Result<bool>> Handle(AllocateStockCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Allocating stock for OutboundOrder {OrderId}", request.OutboundOrderId);

        var order = await _context.OutboundOrders
            .Include(o => o.Lines)
            .FirstOrDefaultAsync(o => o.Id == request.OutboundOrderId, cancellationToken);

        if (order == null)
        {
            return Result<bool>.Failure(Error.NotFound("OutboundOrder.NotFound", $"Order {request.OutboundOrderId} not found"));
        }

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.OperatorId,
            order.WarehouseId,
            null,
            "outbound:allocate",
            cancellationToken);
        if (!hasPermission)
        {
            return Result<bool>.Failure(new Error("Forbidden", $"Operator '{request.OperatorId}' does not have permission 'outbound:allocate' for warehouse '{order.WarehouseId}'."));
        }

        if (order.Status == OutboundOrderStatus.Allocated)
        {
            _logger.LogInformation("Order {OrderId} is already fully allocated.", order.Id);
            return Result<bool>.Success(true);
        }

        if (order.Status != OutboundOrderStatus.Draft && 
            order.Status != OutboundOrderStatus.PendingAllocation && 
            order.Status != OutboundOrderStatus.PartiallyAllocated)
        {
            return Result<bool>.Failure(new Error("OutboundOrder.InvalidStatus", $"Cannot allocate order in status {order.Status}"));
        }

        bool allLinesAllocated = true;
        var allocationErrors = new List<string>();

        foreach (var line in order.Lines)
        {
            int quantityToReserve = line.RequestedQty - line.ReservedQty;
            
            if (quantityToReserve <= 0) continue; // Already fully reserved

            try
            {
                // Gọi InventoryService để Reserve
                var correlationId = $"ALLOC-{order.Id}-{line.Sku}-{line.ReservedQty}"; // Idempotency key (tùy chọn)

                var reservationId = await _inventoryService.ReserveAsync(
                    tenantId: order.TenantId,
                    warehouseId: order.WarehouseId,
                    sku: line.Sku,
                    quantity: quantityToReserve,
                    referenceId: order.Id.ToString(),
                    referenceType: ReservationType.OutboundOrder,
                    operatorSub: request.OperatorId,
                    correlationId: correlationId,
                    cancellationToken: cancellationToken
                );

                // Nếu thành công, cập nhật Line
                line.UpdateReserved(line.ReservedQty + quantityToReserve);
            }
            catch (InsufficientStockException ex)
            {
                if (order.AllowPartial && ex.Available > 0)
                {
                    try
                    {
                        var correlationId = $"ALLOC-PARTIAL-{order.Id}-{line.Sku}-{line.ReservedQty}";
                        var reservationId = await _inventoryService.ReserveAsync(
                            tenantId: order.TenantId,
                            warehouseId: order.WarehouseId,
                            sku: line.Sku,
                            quantity: ex.Available,
                            referenceId: order.Id.ToString(),
                            referenceType: ReservationType.OutboundOrder,
                            operatorSub: request.OperatorId,
                            correlationId: correlationId,
                            cancellationToken: cancellationToken
                        );

                        line.UpdateReserved(line.ReservedQty + ex.Available);
                        _logger.LogInformation("Partially reserved {Reserved} of {Requested} for SKU {Sku}", ex.Available, line.RequestedQty, line.Sku);
                        allocationErrors.Add($"SKU {line.Sku}: Partially allocated {ex.Available}/{line.RequestedQty}.");
                    }
                    catch (Exception partialEx)
                    {
                        _logger.LogError(partialEx, "Error partially allocating stock for SKU {Sku} in Order {OrderId}", line.Sku, order.Id);
                        allocationErrors.Add($"SKU {line.Sku}: System error during partial allocation");
                    }
                }
                else
                {
                    _logger.LogWarning(ex, "Insufficient stock for SKU {Sku} in Order {OrderId}", line.Sku, order.Id);
                    allocationErrors.Add($"SKU {line.Sku}: {ex.Message}");
                }
                allLinesAllocated = false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error allocating stock for SKU {Sku} in Order {OrderId}", line.Sku, order.Id);
                allocationErrors.Add($"SKU {line.Sku}: System error");
                allLinesAllocated = false;
            }
        }

        // Cập nhật trạng thái
        bool anyLineReserved = order.Lines.Any(l => l.ReservedQty > 0);

        if (allLinesAllocated)
        {
            order.UpdateStatus(OutboundOrderStatus.Allocated);
            _logger.LogInformation("Order {OrderId} fully allocated", order.Id);
        }
        else if (anyLineReserved)
        {
            order.UpdateStatus(OutboundOrderStatus.PartiallyAllocated);
            _logger.LogInformation("Order {OrderId} partially allocated", order.Id);
        }
        else
        {
            order.UpdateStatus(OutboundOrderStatus.PendingAllocation);
            _logger.LogInformation("Order {OrderId} failed to allocate any items.", order.Id);
        }

        await _context.SaveChangesAsync(cancellationToken);

        if (!allLinesAllocated)
        {
            if (order.AllowPartial && anyLineReserved)
            {
                // Partial allocation is allowed and successful
                return Result<bool>.Success(true);
            }
            return Result<bool>.Failure(new Error("OutboundOrder.PartialAllocation", string.Join("; ", allocationErrors)));
        }

        return Result<bool>.Success(true);
    }
}
