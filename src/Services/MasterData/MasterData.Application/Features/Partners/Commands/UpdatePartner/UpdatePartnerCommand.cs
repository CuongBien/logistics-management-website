using Logistics.Core;
using MediatR;

namespace MasterData.Application.Features.Partners.Commands.UpdatePartner;

public record UpdatePartnerCommand(
    Guid Id,
    string TenantId,
    string Name,
    string? Phone,
    string? Address,
    string? City,
    double? Latitude,
    double? Longitude
) : IRequest<Result>;
