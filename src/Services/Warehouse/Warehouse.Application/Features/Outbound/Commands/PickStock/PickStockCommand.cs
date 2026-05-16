using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.PickStock;

public record PickStockCommand(
    Guid OutboundOrderId,
    string? WaveId = null) : IRequest<Result<bool>>;
