using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MasterData.Application.Common.Interfaces;
using MasterData.Application.Features.Partners.Queries.GetPartners;

namespace MasterData.Application.Features.Partners.Queries.GetPartnerById;

public class GetPartnerByIdQueryHandler : IRequestHandler<GetPartnerByIdQuery, Result<PartnerDto>>
{
    private readonly IApplicationDbContext _context;

    public GetPartnerByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<PartnerDto>> Handle(GetPartnerByIdQuery request, CancellationToken cancellationToken)
    {
        var partner = await _context.Partners
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.TenantId == request.TenantId, cancellationToken);

        if (partner == null)
        {
            return Result<PartnerDto>.Failure(new Error("Partner.NotFound", $"Partner with Id {request.Id} was not found."));
        }

        var dto = new PartnerDto(
            partner.Id,
            partner.Code,
            partner.Name,
            partner.Type.ToString(),
            partner.Phone,
            partner.Email,
            partner.Address,
            partner.City,
            partner.District,
            partner.Latitude,
            partner.Longitude,
            partner.IsActive,
            partner.CreatedAt
        );

        return Result<PartnerDto>.Success(dto);
    }
}
