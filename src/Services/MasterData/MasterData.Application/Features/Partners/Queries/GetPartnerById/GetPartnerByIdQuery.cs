using Logistics.Core;
using MediatR;
using MasterData.Application.Features.Partners.Queries.GetPartners;

namespace MasterData.Application.Features.Partners.Queries.GetPartnerById;

public record GetPartnerByIdQuery(Guid Id, string TenantId) : IRequest<Result<PartnerDto>>;
