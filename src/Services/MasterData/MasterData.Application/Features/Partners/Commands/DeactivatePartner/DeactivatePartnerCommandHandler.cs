using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using MasterData.Application.Common.Interfaces;

namespace MasterData.Application.Features.Partners.Commands.DeactivatePartner;

public class DeactivatePartnerCommandHandler : IRequestHandler<DeactivatePartnerCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeactivatePartnerCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeactivatePartnerCommand request, CancellationToken cancellationToken)
    {
        var partner = await _context.Partners
            .FirstOrDefaultAsync(p => p.Id == request.Id && p.TenantId == request.TenantId, cancellationToken);

        if (partner == null)
        {
            return Result.Failure(new Error("Partner.NotFound", $"Partner with Id {request.Id} was not found."));
        }

        partner.Deactivate();

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
