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
    public DbSet<OperatorProfile> OperatorProfiles => Set<OperatorProfile>();
    public DbSet<OperatorWarehouseScope> OperatorWarehouseScopes => Set<OperatorWarehouseScope>();
    public DbSet<ErpSkuMirror> ErpSkuMirrors => Set<ErpSkuMirror>();
    public DbSet<ErpWarehouseMirror> ErpWarehouseMirrors => Set<ErpWarehouseMirror>();
    public DbSet<ErpSyncCheckpoint> ErpSyncCheckpoints => Set<ErpSyncCheckpoint>();
    public DbSet<OutboundOrder> OutboundOrders => Set<OutboundOrder>();
    public DbSet<Shipment> Shipments => Set<Shipment>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);

        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();
    }
}
