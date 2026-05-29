using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;
using EventBus.Messages.Events;

namespace Warehouse.Application.Features.Inbound.Commands.ForceCloseReceipt;

public record ForceCloseReceiptCommand(Guid ReceiptId, string TenantId, string ClosedBySub) : IRequest<Result>;

public class ForceCloseReceiptCommandHandler : IRequestHandler<ForceCloseReceiptCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly MassTransit.IPublishEndpoint _publishEndpoint;
    private readonly IOperatorAuthorizationService _authService;

    public ForceCloseReceiptCommandHandler(
        IApplicationDbContext context, 
        MassTransit.IPublishEndpoint publishEndpoint,
        IOperatorAuthorizationService authService)
    {
        _context = context;
        _publishEndpoint = publishEndpoint;
        _authService = authService;
    }

    public async Task<Result> Handle(ForceCloseReceiptCommand request, CancellationToken cancellationToken)
    {
        var receipt = await _context.InboundReceipts
            .Include(r => r.Lines)
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);

        if (receipt == null)
            return Result.Failure(new Error("InboundReceipt.NotFound", $"InboundReceipt with Id {request.ReceiptId} not found."));

        // Check permission
        var hasPermission = await _authService.HasPermissionAsync(
            request.ClosedBySub, 
            receipt.WarehouseId, 
            null, 
            "inbound:force_close", 
            cancellationToken);

        if (!hasPermission)
        {
            return Result.Failure(new Error(
                "Operator.Forbidden",
                $"Operator '{request.ClosedBySub}' does not have permission 'inbound:force_close' for warehouse '{receipt.WarehouseId}'."));
        }

        // Only allow Force Close if it's Pending or PartiallyReceived
        if (receipt.Status != InboundReceiptStatus.Pending && receipt.Status != InboundReceiptStatus.PartiallyReceived)
        {
            return Result.Failure(new Error("InboundReceipt.CannotForceClose", $"Cannot force close receipt in status {receipt.Status}."));
        }

        // Force Close the receipt
        receipt.ForceClose();

        // Detect Shortages and create Discrepancies
        foreach (var line in receipt.Lines)
        {
            if (line.ExpectedQuantity > line.ReceivedQuantity)
            {
                var discrepancy = new InboundDiscrepancy(
                    receipt.Id,
                    receipt.WarehouseId,
                    line.Sku,
                    line.ExpectedQuantity,
                    line.ReceivedQuantity,
                    request.ClosedBySub,
                    "Shortage detected upon Force Close."
                );
                _context.InboundDiscrepancies.Add(discrepancy);
            }
        }

        // Emit integration event so OMS knows this is "closed" despite not being fully received.
        var integrationEvent = new ShipmentReceivedIntegrationEvent(
            receipt.OrderId,
            receipt.WarehouseId.ToString(),
            request.ClosedBySub
        );

        await _publishEndpoint.Publish(integrationEvent, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
