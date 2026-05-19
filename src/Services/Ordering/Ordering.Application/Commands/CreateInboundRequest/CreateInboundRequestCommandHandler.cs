using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Entities;
using Ordering.Domain.ValueObjects;
using Ordering.Domain.Enums;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Ordering.Application.Commands.CreateInboundRequest;

public class CreateInboundRequestCommandHandler : IRequestHandler<CreateInboundRequestCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateInboundRequestCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateInboundRequestCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate SkuCodes
        var skuCodes = request.Items.Select(x => x.SkuCode).ToList();
        var skuMirrors = await _context.ErpSkuMirrors
            .Where(x => x.TenantId == request.TenantId && x.Status == "active" && skuCodes.Contains(x.SkuCode))
            .ToListAsync(cancellationToken);

        var missingSkuCodes = skuCodes.Except(skuMirrors.Select(x => x.SkuCode)).ToArray();
        if (missingSkuCodes.Length > 0)
        {
            return Result<Guid>.Failure(new Error(
                "ErpSkuMirror.MissingMapping",
                $"Cannot create inbound request because SKU mappings are missing for tenant '{request.TenantId}': {string.Join(", ", missingSkuCodes)}"));
        }

        // 2. Validate Destination Warehouse
        var warehouseMirror = await _context.ErpWarehouseMirrors
            .FirstOrDefaultAsync(x => x.TenantId == request.TenantId && x.WarehouseCode == request.DestinationWarehouseCode && x.Status == "active", cancellationToken);

        if (warehouseMirror == null)
        {
            return Result<Guid>.Failure(new Error(
                "ErpWarehouseMirror.NotFound",
                $"Destination warehouse with code '{request.DestinationWarehouseCode}' was not found or is inactive."));
        }

        // 3. Create Consignee (which points to the destination warehouse)
        var consignee = new Consignee(
            fullName: warehouseMirror.Name,
            phone: "000-000-0000",
            address: new Address("Warehouse location", "N/A", "N/A", "N/A", "000000"),
            partnerId: warehouseMirror.WarehouseCode
        );

        // 4. Create Order Aggregate
        var orderResult = Order.Create(
            tenantId: request.TenantId,
            consignorId: request.ConsignorId,
            consignee: consignee,
            codAmount: 0,
            shippingFee: 0,
            weight: 1.0m, // Inbound doesn't strictly have a shipping weight, default to 1.0
            note: request.Note,
            type: OrderType.InboundRequest,
            fulfillment: FulfillmentMode.Pickup // Default for inbound, doesn't matter since it skips Saga
        );

        if (orderResult.IsFailure)
        {
            return Result<Guid>.Failure(orderResult.Error);
        }

        var order = orderResult.Value!;

        // Add OrderItems
        foreach (var item in request.Items)
        {
            var skuMirror = skuMirrors.First(x => x.SkuCode == item.SkuCode);
            order.AddItem(skuMirror.Id, skuMirror.SkuCode, item.Quantity);
        }

        // 5. Save
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(order.Id);
    }
}
