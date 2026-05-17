using Microsoft.EntityFrameworkCore;
using MasterData.Domain.Entities;

namespace MasterData.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Partner> Partners { get; }
    DbSet<ConsolidationRule> ConsolidationRules { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
