using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<Domain.Entities.Warehouse> Warehouses { get; }
    DbSet<Block> Blocks { get; }
    DbSet<Zone> Zones { get; }
    DbSet<Bin> Bins { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
