using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Domain.Entities.Warehouse> Warehouses { get; }
    DbSet<Block> Blocks { get; }
    DbSet<Zone> Zones { get; }
    DbSet<Bin> Bins { get; }
    DbSet<InventoryItem> InventoryItems { get; }
    DbSet<InboundReceipt> InboundReceipts { get; }
    DbSet<InboundItem> InboundItems { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
