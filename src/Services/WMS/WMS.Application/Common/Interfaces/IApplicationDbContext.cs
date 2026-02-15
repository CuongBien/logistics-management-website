using Microsoft.EntityFrameworkCore;
using WMS.Domain.Entities;

namespace WMS.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<InventoryItem> InventoryItems { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
