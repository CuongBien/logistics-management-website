using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MasterData.Application.Common.Interfaces;

namespace MasterData.Application.Features.Partners.Commands.UpdatePartner;

public class UpdatePartnerCommandHandler : IRequestHandler<UpdatePartnerCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public UpdatePartnerCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdatePartnerCommand request, CancellationToken cancellationToken)
    {
        var partner = await _context.Partners
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.TenantId == request.TenantId, cancellationToken);

        if (partner == null)
        {
            return Result.Failure(new Error("Partner.NotFound", $"Partner with Id {request.Id} was not found."));
        }

        partner.UpdateInfo(request.Name, request.Phone, request.Address, request.City, request.Latitude, request.Longitude);

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
