using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.AllocateStock;

public record AllocateStockCommand(
    Guid OutboundOrderId, 
    string OperatorId) : IRequest<Result<bool>>;
