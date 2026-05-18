using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.PickStock;

public record PickStockCommand(
    Guid OutboundOrderId,
    string OperatorId,
    string? WaveId = null) : IRequest<Result<bool>>;
