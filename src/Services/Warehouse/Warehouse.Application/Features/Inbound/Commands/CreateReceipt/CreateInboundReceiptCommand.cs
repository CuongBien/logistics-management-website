using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inbound.Commands.CreateReceipt;

public record ExpectedReceiptLine(string SkuCode, int ExpectedQuantity, string Uom = "EA");

public record CreateInboundReceiptCommand(Guid OrderId, string TenantId, string CustomerId, Guid WarehouseId, string? SourceShipmentNo, List<ExpectedReceiptLine>? ExpectedLines = null) : IRequest<Result<Guid>>;

public class CreateInboundReceiptCommandHandler : IRequestHandler<CreateInboundReceiptCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateInboundReceiptCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateInboundReceiptCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.TenantId) || string.IsNullOrWhiteSpace(request.CustomerId))
        {
            return Result<Guid>.Failure(new Error("InboundReceipt.MissingOwnership", "TenantId and CustomerId are required."));
        }

        var sourceShipmentNo = request.SourceShipmentNo;
        if (string.IsNullOrWhiteSpace(sourceShipmentNo))
        {
            sourceShipmentNo = $"ASN-{request.OrderId:N}";
        }

        // Kiểm tra xem đã có Receipt cho Shipment này tại Kho này chưa
        var existing = await _context.InboundReceipts
            .FirstOrDefaultAsync(
                r => r.ShipmentNo == sourceShipmentNo && r.WarehouseId == request.WarehouseId && r.TenantId == request.TenantId,
                cancellationToken);

        if (existing is not null)
            return Result<Guid>.Failure(new Error("InboundReceipt.AlreadyExists",
                $"An inbound receipt for shipment '{sourceShipmentNo}' at warehouse '{request.WarehouseId}' already exists."));

        var receiptNo = $"RCV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        var receipt = new InboundReceipt(request.TenantId, request.CustomerId, request.WarehouseId, receiptNo, "PURCHASE_ORDER", request.OrderId.ToString(), sourceShipmentNo);
        
        if (request.ExpectedLines != null && request.ExpectedLines.Any())
        {
            int lineNo = 1;
            foreach (var expectedLine in request.ExpectedLines)
            {
                var line = new InboundReceiptLine(receipt.Id, lineNo++, request.TenantId, request.CustomerId, expectedLine.SkuCode, expectedLine.Uom, expectedLine.ExpectedQuantity);
                receipt.AddLine(line);
                _context.InboundReceiptLines.Add(line);
            }
        }

        _context.InboundReceipts.Add(receipt);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(receipt.Id);
    }
}
