using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.ReserveStock;

public record ReserveStockCommand(Guid OutboundOrderId) : IRequest<bool>;
