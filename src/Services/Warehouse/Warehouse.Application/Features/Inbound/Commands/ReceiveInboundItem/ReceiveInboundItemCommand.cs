using MediatR;
using Logistics.Core;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveInboundItem;

public record ReceiveInboundItemCommand(
   Guid ReceiptId,
   Guid OrderId,
   string TenantId,
   string SkuCode,
   string BinCode,
   string ScannedBy
) : IRequest<Result>;