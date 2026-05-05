using System;
using System.Threading;
using System.Threading.Tasks;
using Logistics.Core;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;

namespace Warehouse.Application.Features.Layout.Commands.CreateWarehouse;

public record CreateWarehouseCommand(string Code, string Name, string LocationText) : IRequest<Result<Guid>>;

internal sealed class CreateWarehouseHandler(IApplicationDbContext context) : IRequestHandler<CreateWarehouseCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var exists = await context.Warehouses.AnyAsync(x => x.Code == request.Code, cancellationToken);
        if (exists)
        {
            return Result<Guid>.Failure(new Error("Warehouse.CodeExists", $"Warehouse code '{request.Code}' already exists."));
        }

        var warehouse = new Domain.Entities.Warehouse(request.Code, request.Name, request.LocationText);
        context.Warehouses.Add(warehouse);
        await context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(warehouse.Id);
    }
}
