using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Ordering.Application.Common.Interfaces;
using Ordering.Domain.Entities;
using Ordering.Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace Ordering.Application.Commands.CreateOrder;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;
    private readonly ILogger<CreateOrderCommandHandler> _logger;

    public CreateOrderCommandHandler(IApplicationDbContext context, MassTransit.IPublishEndpoint publishEndpoint, ILogger<CreateOrderCommandHandler> logger)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var skuMirrors = await _context.ErpSkuMirrors
            .Where(x => x.TenantId == request.TenantId && x.Status == "active" && request.SkuCodes.Contains(x.SkuCode))
            .ToListAsync(cancellationToken);

        var missingSkuCodes = request.SkuCodes.Except(skuMirrors.Select(x => x.SkuCode)).ToArray();

        if (missingSkuCodes.Length > 0)
        {
            return Result<Guid>.Failure(new Error(
                "ErpSkuMirror.MissingMapping",
                $"Cannot create order because SKU mappings are missing for tenant '{request.TenantId}': {string.Join(", ", missingSkuCodes)}"));
        }

        // 1. Build Consignee Value Object
        Address? address = null;
        if (request.Consignee.Address != null)
        {
            address = new Address(
                request.Consignee.Address.Street ?? "N/A",
                request.Consignee.Address.City ?? "N/A",
                request.Consignee.Address.State ?? "N/A",
                request.Consignee.Address.Country ?? "N/A",
                request.Consignee.Address.ZipCode ?? "000000");
        }

        var consignee = new Consignee(
            request.Consignee.FullName,
            request.Consignee.Phone,
            address,
            request.Consignee.PartnerId,
            request.Consignee.Latitude,
            request.Consignee.Longitude);

        // 2. Create Order Aggregate (auto-generates WaybillCode)
        string? consignorCity = request.Consignor?.Address?.City;
        string? consignorAddress = null;
        if (request.Consignor?.Address != null)
        {
            var parts = new[] { request.Consignor.Address.Street, request.Consignor.Address.City, request.Consignor.Address.State }
                .Where(x => !string.IsNullOrWhiteSpace(x));
            consignorAddress = string.Join(", ", parts);
        }

        var orderResult = Order.Create(
            request.TenantId,
            request.ConsignorId,
            consignee,
            request.CodAmount,
            request.ShippingFee,
            request.Weight,
            request.Note,
            (Ordering.Domain.Enums.OrderType)request.OrderType,
            (Ordering.Domain.Enums.FulfillmentMode)request.FulfillmentMode,
            request.SourceWarehouseCode,
            consignorCity,
            consignorAddress);

        if (orderResult.IsFailure)
        {
            return Result<Guid>.Failure(orderResult.Error);
        }

        var order = orderResult.Value!;

        // Add OrderItems
        var skuQuantities = request.SkuCodes.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
        foreach (var skuMirror in skuMirrors)
        {
            var quantity = skuQuantities[skuMirror.SkuCode];
            order.AddItem(skuMirror.Id, skuMirror.SkuCode, quantity);
        }

        // 3. Auto-confirm (validate → AwaitingPickup) or set InWarehouse directly (for pre-stocked warehouse fulfillment)
        Result confirmResult;
        if (request.FulfillmentMode == 2) // Warehouse
        {
            confirmResult = order.SetInWarehouseDirectly();
        }
        else // Pickup
        {
            confirmResult = order.Confirm();
        }

        if (confirmResult.IsFailure)
        {
            return Result<Guid>.Failure(confirmResult.Error);
        }

        // 4. Handle SaveToContacts (Async - Must be before SaveChanges for Outbox)
        if (request.SaveToContacts && !string.IsNullOrEmpty(request.Consignee.FullName) && !string.IsNullOrEmpty(request.Consignee.Phone))
        {
            _logger.LogInformation("Publishing NewPartnerEncounteredIntegrationEvent for phone {Phone}", request.Consignee.Phone);
            await _publishEndpoint.Publish(new EventBus.Messages.Events.NewPartnerEncounteredIntegrationEvent
            {
                TenantId = request.TenantId,
                Name = request.Consignee.FullName,
                Phone = request.Consignee.Phone,
                Address = request.Consignee.Address?.Street ?? "N/A",
                City = request.Consignee.Address?.City ?? "N/A",
                PartnerId = request.Consignee.PartnerId,
                Latitude = request.Consignee.Latitude,
                Longitude = request.Consignee.Longitude
            }, cancellationToken);
        }

        // 5. Persist
        _context.Orders.Add(order);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(order.Id);
    }
}
