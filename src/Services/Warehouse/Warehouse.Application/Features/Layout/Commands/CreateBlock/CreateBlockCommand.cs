using System;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Layout.Commands.CreateBlock;

public record CreateBlockCommand(Guid WarehouseId, string BlockCode) : IRequest<Result<Guid>>;

internal sealed class CreateBlockHandler(IApplicationDbContext context) : IRequestHandler<CreateBlockCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateBlockCommand request, CancellationToken cancellationToken)
    {
        var warehouseExists = await context.Warehouses.AnyAsync(x => x.Id == request.WarehouseId, cancellationToken);
        if (!warehouseExists)
        {
            return Result<Guid>.Failure(new Error("Warehouse.NotFound", "Warehouse not found."));
        }

        var exists = await context.Blocks.AnyAsync(x => x.WarehouseId == request.WarehouseId && x.BlockCode == request.BlockCode, cancellationToken);
        if (exists)
        {
            return Result<Guid>.Failure(new Error("Block.CodeExists", $"Block code '{request.BlockCode}' already exists in this warehouse."));
        }

        var block = new Block(request.WarehouseId, request.BlockCode);
        context.Blocks.Add(block);
        await context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(block.Id);
    }
}
