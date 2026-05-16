using Logistics.Core;
using MasterData.Application.Common.Interfaces;
using MasterData.Domain.Entities;
using MasterData.Domain.Enums;
using MediatR;

namespace MasterData.Application.Features.Partners.Commands.CreatePartner;

public record CreatePartnerCommand : IRequest<Result<Guid>>
{
    public string TenantId { get; init; } = default!;
    public string Code { get; init; } = default!;
    public string Name { get; init; } = default!;
    public PartnerType Type { get; init; }
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public string? City { get; init; }
}

public class CreatePartnerCommandHandler : IRequestHandler<CreatePartnerCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreatePartnerCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreatePartnerCommand request, CancellationToken cancellationToken)
    {
        var partner = new Partner(
            request.TenantId,
            request.Code,
            request.Name,
            request.Type,
            request.Phone,
            request.Address,
            request.City
        );

        _context.Partners.Add(partner);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(partner.Id);
    }
}
