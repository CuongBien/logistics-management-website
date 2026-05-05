using System;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Layout.Commands.CreateZone;

public record CreateZoneCommand(Guid BlockId, string ZoneCode, ZoneType ZoneType) : IRequest<Result<Guid>>;

internal sealed class CreateZoneHandler(IApplicationDbContext context) : IRequestHandler<CreateZoneCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateZoneCommand request, CancellationToken cancellationToken)
    {
        var blockExists = await context.Blocks.AnyAsync(x => x.Id == request.BlockId, cancellationToken);
        if (!blockExists)
        {
            return Result<Guid>.Failure(new Error("Block.NotFound", "Block not found."));
        }

        var zone = new Zone(request.BlockId, request.ZoneCode, request.ZoneType);
        context.Zones.Add(zone);
        await context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(zone.Id);
    }
}
