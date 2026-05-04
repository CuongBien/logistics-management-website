using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inbound.Commands.CreateReceipt;

public record CreateInboundReceiptCommand(Guid OrderId, string TenantId, string CustomerId, Guid WarehouseId, string? SourceShipmentNo) : IRequest<Result<Guid>>;

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

        // Kiểm tra xem đã có Receipt cho Order này chưa
        var existing = await _context.InboundReceipts
            .FirstOrDefaultAsync(
                r => r.OrderId == request.OrderId && r.TenantId == request.TenantId,
                cancellationToken);

        if (existing is not null)
            return Result<Guid>.Failure(new Error("InboundReceipt.AlreadyExists",
                $"An inbound receipt for Order '{request.OrderId}' already exists."));

        var receipt = new InboundReceipt(request.OrderId, request.TenantId, request.CustomerId, request.WarehouseId, sourceShipmentNo);
        _context.InboundReceipts.Add(receipt);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(receipt.Id);
    }
}
