using Logistics.Core;
using MediatR;

namespace Warehouse.Application.Features.Outbound.Commands.SortOrder;

public record SortOrderCommand(Guid OrderId, Guid DestinationHubId) : IRequest<Result>;
