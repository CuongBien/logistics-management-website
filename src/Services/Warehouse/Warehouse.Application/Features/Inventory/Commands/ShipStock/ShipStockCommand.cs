using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Inventory.Commands.ShipStock;

public sealed record ShipStockCommand(Guid ReservationId, int Quantity, string? CorrelationId = null) : IRequest<Result<bool>>;
