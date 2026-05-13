using Warehouse.Domain.Enums;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveReceipt;

public class ReceiveInboundReceiptCommandHandler : IRequestHandler<ReceiveInboundReceiptCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public ReceiveInboundReceiptCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(ReceiveInboundReceiptCommand request, CancellationToken cancellationToken)
    {
        var receipt = await _context.InboundReceipts
            .FirstOrDefaultAsync(r => r.Id == request.ReceiptId, cancellationToken);

        if (receipt is null)
            return Result.Failure(new Error("InboundReceipt.NotFound",
                $"Inbound receipt '{request.ReceiptId}' was not found."));

        if (receipt.Status == InboundReceiptStatus.Completed || receipt.Status == InboundReceiptStatus.CompletedWithExceptions)
            return Result.Failure(new Error("InboundReceipt.AlreadyReceived",
                "This receipt has already been marked as received."));

        receipt.StartReceiving();

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
