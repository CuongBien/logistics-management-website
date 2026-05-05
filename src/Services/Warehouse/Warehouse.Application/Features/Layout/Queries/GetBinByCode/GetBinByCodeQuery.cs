using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Application.Features.Layout.Dtos;

namespace Warehouse.Application.Features.Layout.Queries.GetBinByCode;

public record GetBinByCodeQuery(Guid WarehouseId, string BinCode) : IRequest<Result<BinDto>>;

internal sealed class GetBinByCodeHandler(IApplicationDbContext context) : IRequestHandler<GetBinByCodeQuery, Result<BinDto>>
{
    public async Task<Result<BinDto>> Handle(GetBinByCodeQuery request, CancellationToken cancellationToken)
    {
        var bin = await context.Bins
            .Include(b => b.Zone)
            .ThenInclude(z => z.Block)
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.BinCode == request.BinCode && b.Zone.Block.WarehouseId == request.WarehouseId, cancellationToken);

        if (bin == null)
        {
            return Result<BinDto>.Failure(new Error("Bin.NotFound", $"Bin with code '{request.BinCode}' not found in the specified warehouse."));
        }

        var dto = new BinDto(bin.Id, bin.ZoneId, bin.BinCode, bin.Status, bin.Version);
        return Result<BinDto>.Success(dto);
    }
}
