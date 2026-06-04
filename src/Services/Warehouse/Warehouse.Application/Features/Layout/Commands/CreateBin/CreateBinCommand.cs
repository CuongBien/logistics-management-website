using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Features.Layout.Commands.CreateBin;

public record CreateBinCommand(Guid WarehouseId, Guid ZoneId, string BinCode, string? Aisle = null, string? Rack = null, string? Shelf = null, int PickSequence = 0) : IRequest<Result<Guid>>;

public class CreateBinCommandHandler : IRequestHandler<CreateBinCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateBinCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateBinCommand request, CancellationToken cancellationToken)
    {
        var zone = await _context.Zones
            .FirstOrDefaultAsync(x => x.Id == request.ZoneId, cancellationToken);
            
        if (zone == null)
            return Result<Guid>.Failure(new Error("Zone.NotFound", $"Zone with Id {request.ZoneId} not found."));

        var exists = await _context.Bins
            .AnyAsync(x => x.WarehouseId == request.WarehouseId && x.BinCode == request.BinCode, cancellationToken);
            
        if (exists)
            return Result<Guid>.Failure(new Error("Bin.DuplicateCode", $"Bin with code '{request.BinCode}' already exists in this warehouse."));

        var bin = new Bin(request.WarehouseId, request.ZoneId, request.BinCode, BinStatus.Available, request.Aisle, request.Rack, request.Shelf, request.PickSequence);
        _context.Bins.Add(bin);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(bin.Id);
    }
}
