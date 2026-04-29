using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Inbound.Commands.CreateReceipt;

public record CreateInboundReceiptCommand(Guid OrderId, string TenantId, string CustomerId, string? SourceShipmentNo) : IRequest<Result<Guid>>;

public class CreateInboundReceiptCommandHandler : IRequestHandler<CreateInboundReceiptCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateInboundReceiptCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateInboundReceiptCommand request, CancellationToken cancellationToken)
    {
        var tenantExists = await _context.ErpWarehouseMirrors
            .AnyAsync(x => x.TenantId == request.TenantId && x.Status == "active", cancellationToken);
        if (!tenantExists)
        {
            return Result<Guid>.Failure(new Error(
                "ErpWarehouseMirror.MissingMapping",
                $"Cannot create inbound receipt because tenant '{request.TenantId}' has no active ERP warehouse mapping."));
        }

        // Kiểm tra xem đã có Receipt cho Order này chưa
        var existing = await _context.InboundReceipts
            .FirstOrDefaultAsync(r => r.OrderId == request.OrderId, cancellationToken);

        if (existing is not null)
            return Result<Guid>.Failure(new Error("InboundReceipt.AlreadyExists",
                $"An inbound receipt for Order '{request.OrderId}' already exists."));

        var receipt = new InboundReceipt(request.OrderId, request.TenantId, request.CustomerId, request.SourceShipmentNo);
        _context.InboundReceipts.Add(receipt);

        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(receipt.Id);
    }
}
