using Logistics.Core;
using MediatR;
using Warehouse.Application.Features.Outbound.Dtos;

namespace Warehouse.Application.Features.Outbound.Queries.GetOutboundOrderById;

public record GetOutboundOrderByIdQuery(Guid Id, string TenantId) : IRequest<Result<OutboundOrderDetailsDto>>;
