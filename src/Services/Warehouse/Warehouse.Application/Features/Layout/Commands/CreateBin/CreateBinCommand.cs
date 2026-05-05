using System;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Layout.Commands.CreateBin;

public record CreateBinCommand(Guid ZoneId, string BinCode, BinStatus Status) : IRequest<Result<Guid>>;

internal sealed class CreateBinHandler(IApplicationDbContext context) : IRequestHandler<CreateBinCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateBinCommand request, CancellationToken cancellationToken)
    {
        var zoneExists = await context.Zones.AnyAsync(x => x.Id == request.ZoneId, cancellationToken);
        if (!zoneExists)
        {
            return Result<Guid>.Failure(new Error("Zone.NotFound", "Zone not found."));
        }

        var exists = await context.Bins.AnyAsync(x => x.ZoneId == request.ZoneId && x.BinCode == request.BinCode, cancellationToken);
        if (exists)
        {
            return Result<Guid>.Failure(new Error("Bin.CodeExists", $"Bin code '{request.BinCode}' already exists in this zone."));
        }

        var bin = new Bin(request.ZoneId, request.BinCode, request.Status);
        context.Bins.Add(bin);
        await context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(bin.Id);
    }
}
