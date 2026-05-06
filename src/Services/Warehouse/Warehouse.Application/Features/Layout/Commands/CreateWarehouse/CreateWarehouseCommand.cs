using Logistics.Core;
using MediatR;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Features.Layout.Commands.CreateWarehouse;

public record CreateWarehouseCommand(string Name, string Code, string LocationText) : IRequest<Result<Guid>>;

public class CreateWarehouseCommandHandler : IRequestHandler<CreateWarehouseCommand, Result<Guid>>
{
    private readonly IApplicationDbContext _context;

    public CreateWarehouseCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<Guid>> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        // 1. Check if code already exists (including soft-deleted if we want to enforce global unique code, 
        // but our Filtered Index allows reusing codes after soft-delete).
        // For business safety, let's just use standard query (which filters out deleted).
        
        var exists = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.AnyAsync(
            _context.Warehouses, x => x.Code == request.Code, cancellationToken);
            
        if (exists)
        {
            return Result<Guid>.Failure(new Error("Warehouse.DuplicateCode", $"Warehouse with code '{request.Code}' already exists."));
        }

        var warehouse = new Domain.Entities.Warehouse(request.Name, request.Code, request.LocationText);
        
        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<Guid>.Success(warehouse.Id);
    }
}
