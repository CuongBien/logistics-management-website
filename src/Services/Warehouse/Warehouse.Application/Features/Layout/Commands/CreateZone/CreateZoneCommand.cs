using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Layout.Commands.CreateZone;

public record CreateZoneCommand(Guid BlockId, ZoneType ZoneType) : IRequest<Result<Guid>>;

public class CreateZoneCommandHandler : IRequestHandler<CreateZoneCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateZoneCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateZoneCommand request, CancellationToken cancellationToken)
    {
        var block = await _context.Blocks
            .FirstOrDefaultAsync(x => x.Id == request.BlockId, cancellationToken);
            
        if (block == null)
            return Result<Guid>.Failure(new Error("Block.NotFound", $"Block with Id {request.BlockId} not found."));

        // Note: Zones are unique by (BlockId, ZoneType)
        var exists = await _context.Zones
            .AnyAsync(x => x.BlockId == request.BlockId && x.ZoneType == request.ZoneType.ToString(), cancellationToken);
            
        if (exists)
            return Result<Guid>.Failure(new Error("Zone.DuplicateType", $"Zone with type '{request.ZoneType}' already exists in this block."));

        var zone = new Zone(request.BlockId, request.ZoneType);
        _context.Zones.Add(zone);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(zone.Id);
    }
}
