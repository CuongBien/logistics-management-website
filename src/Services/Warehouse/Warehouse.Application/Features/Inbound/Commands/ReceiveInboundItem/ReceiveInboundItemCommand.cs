using MediatR;
using Logistics.Core;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;

public record ReceiveInboundItemCommand(
   Guid ReceiptId,
   Guid OrderId,
   string BinCode,
   string ScannedBy
) : IRequest<Result>;