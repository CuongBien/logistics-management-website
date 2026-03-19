using Microsoft.EntityFrameworkCore;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<InventoryItem> InventoryItems { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
