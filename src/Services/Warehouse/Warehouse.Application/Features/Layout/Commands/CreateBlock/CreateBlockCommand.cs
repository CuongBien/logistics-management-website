using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Layout.Commands.CreateBlock;

public record CreateBlockCommand(Guid WarehouseId, string BlockCode) : IRequest<Result<Guid>>;

public class CreateBlockCommandHandler : IRequestHandler<CreateBlockCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateBlockCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateBlockCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _context.Warehouses
            .FirstOrDefaultAsync(x => x.Id == request.WarehouseId, cancellationToken);
            
        if (warehouse == null)
            return Result<Guid>.Failure(new Error("Warehouse.NotFound", $"Warehouse with Id {request.WarehouseId} not found."));

        var exists = await _context.Blocks
            .AnyAsync(x => x.WarehouseId == request.WarehouseId && x.BlockCode == request.BlockCode, cancellationToken);
            
        if (exists)
            return Result<Guid>.Failure(new Error("Block.DuplicateCode", $"Block with code '{request.BlockCode}' already exists in this warehouse."));

        var block = new Block(request.WarehouseId, request.BlockCode);
        _context.Blocks.Add(block);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(block.Id);
    }
}
