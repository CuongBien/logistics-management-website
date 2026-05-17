using MasterData.Application.Common.Interfaces;
using MasterData.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using MassTransit;

namespace MasterData.Infrastructure.Persistence;

public class MasterDataDbContext : DbContext, IApplicationDbContext
{
    public MasterDataDbContext(DbContextOptions<MasterDataDbContext> options) : base(options) { }

    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<ConsolidationRule> ConsolidationRules => Set<ConsolidationRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(MasterDataDbContext).Assembly);
        
        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();

        base.OnModelCreating(modelBuilder);
    }
}
