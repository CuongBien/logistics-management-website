using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Errors;

namespace Warehouse.Application.Features.Outbound.Commands.CreateOutboundOrder;

public sealed class CreateOutboundOrderCommandHandler : IRequestHandler<CreateOutboundOrderCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<CreateOutboundOrderCommandHandler> _logger;

    public CreateOutboundOrderCommandHandler(IApplicationDbContext context, ILogger<CreateOutboundOrderCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateOutboundOrderCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating outbound order {OrderId} for tenant {TenantId} at warehouse {WarehouseId}", 
            request.OrderId, request.TenantId, request.WarehouseId);

        if (request.Lines == null || !request.Lines.Any())
        {
            return Result<Guid>.Failure(new Error("OutboundOrder.EmptyLines", "Order must contain at least one line item."));
        }

        // Idempotency Check
        var existingOrder = await _context.OutboundOrders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId, cancellationToken);

        if (existingOrder != null)
        {
            _logger.LogInformation("Outbound order {OrderId} already exists. Returning existing ID.", request.OrderId);
            return Result<Guid>.Success(existingOrder.Id);
        }

        // Create Entity
        var outboundOrder = OutboundOrder.Create(
            request.TenantId,
            request.CustomerId,
            request.WarehouseId,
            request.OrderId,
            request.OrderNo,
            request.DestinationAddress,
            request.DestinationCity,
            request.Priority,
            request.AllowPartial);

        // Map Lines (enforces unique SKU per order inside the entity)
        try
        {
            // Note: If you want to handle duplicate SKUs in the request by aggregating them, 
            // you can group by SKU first. Here we assume the client provides grouped SKUs.
            var groupedLines = request.Lines
                .GroupBy(l => l.Sku)
                .Select(g => new { Sku = g.Key, Qty = g.Sum(x => x.Quantity), Uom = g.First().Uom });

            foreach (var line in groupedLines)
            {
                outboundOrder.AddLine(line.Sku, line.Qty, line.Uom);
            }
        }
        catch (InvalidOperationException ex)
        {
            return Result<Guid>.Failure(new Error("OutboundOrder.InvalidLines", ex.Message));
        }

        _context.OutboundOrders.Add(outboundOrder);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Successfully created outbound order {OrderId}", outboundOrder.Id);

        return Result<Guid>.Success(outboundOrder.Id);
    }
}
