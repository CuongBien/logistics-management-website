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
    public DbSet<InventoryReservation> InventoryReservations => Set<InventoryReservation>();
    public DbSet<InboundReceipt> InboundReceipts => Set<InboundReceipt>();
    public DbSet<InboundReceiptLine> InboundReceiptLines => Set<InboundReceiptLine>();
    public DbSet<InboundBinAllocation> InboundBinAllocations => Set<InboundBinAllocation>();
    public DbSet<OperatorProfile> OperatorProfiles => Set<OperatorProfile>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<OperatorRoleAssignment> OperatorRoleAssignments => Set<OperatorRoleAssignment>();

    public DbSet<ErpSkuMirror> ErpSkuMirrors => Set<ErpSkuMirror>();
    public DbSet<ErpWarehouseMirror> ErpWarehouseMirrors => Set<ErpWarehouseMirror>();
    public DbSet<ErpSyncCheckpoint> ErpSyncCheckpoints => Set<ErpSyncCheckpoint>();
    public DbSet<OutboundOrder> OutboundOrders => Set<OutboundOrder>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<InventoryLedger> InventoryLedgers => Set<InventoryLedger>();
    public DbSet<InventoryReconciliationReport> InventoryReconciliationReports => Set<InventoryReconciliationReport>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);

        // Apply Global Query Filter for ISoftDelete
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (typeof(Logistics.Core.ISoftDelete).IsAssignableFrom(entityType.ClrType))
            {
                builder.Entity(entityType.ClrType).HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
            }
        }

        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();
    }

    private static System.Linq.Expressions.LambdaExpression ConvertFilterExpression(Type type)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
        var propertyMethod = typeof(EF).GetMethod("Property")!.MakeGenericMethod(typeof(bool));
        var isDeletedProperty = System.Linq.Expressions.Expression.Call(propertyMethod, parameter, System.Linq.Expressions.Expression.Constant("IsDeleted"));
        var compareExpression = System.Linq.Expressions.Expression.Equal(isDeletedProperty, System.Linq.Expressions.Expression.Constant(false));
        return System.Linq.Expressions.Expression.Lambda(compareExpression, parameter);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Logistics.Core.ISoftDelete>())
        {
            switch (entry.State)
            {
                case EntityState.Deleted:
                    entry.State = EntityState.Modified;
                    entry.Entity.Delete();
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
