using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inbound.Commands.ReceiveReceipt;

public record ReceiveInboundReceiptCommand(Guid ReceiptId) : IRequest<Result>;
