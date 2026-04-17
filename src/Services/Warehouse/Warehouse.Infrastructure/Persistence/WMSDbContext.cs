using System.Reflection;
using System.Reflection;
using Microsoft.EntityFrameworkCore;
using MassTransit;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence;

public class WMSDbContext : DbContext, IApplicationDbContext
{
    public WMSDbContext(DbContextOptions<WMSDbContext> options) : base(options)
    {
    }

    public DbSet<Domain.Entities.Warehouse> Warehouses => Set<Domain.Entities.Warehouse>();
    public DbSet<Block> Blocks => Set<Block>();
    public DbSet<Zone> Zones => Set<Zone>();
    public DbSet<Bin> Bins => Set<Bin>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<InboundReceipt> InboundReceipts => Set<InboundReceipt>();
    public DbSet<InboundItem> InboundItems => Set<InboundItem>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);

        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();
    }
}
