using Logistics.Core;
using MediatR;

namespace MasterData.Application.Features.Partners.Commands.DeactivatePartner;

public record DeactivatePartnerCommand(Guid Id, string TenantId) : IRequest<Result>;
