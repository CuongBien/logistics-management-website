using MassTransit;
using Microsoft.EntityFrameworkCore;
using Warehouse.Application.Common.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence;

public class WMSDbContext : DbContext, IApplicationDbContext
{
    public WMSDbContext(DbContextOptions<WMSDbContext> options) : base(options) { }

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
    
    // Outbound
    public DbSet<OutboundOrder> OutboundOrders => Set<OutboundOrder>();
    public DbSet<OutboundOrderLine> OutboundOrderLines => Set<OutboundOrderLine>();
    public DbSet<PickTask> PickTasks => Set<PickTask>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentItem> ShipmentItems => Set<ShipmentItem>();
    public DbSet<ShipmentOrder> ShipmentOrders => Set<ShipmentOrder>();

    public DbSet<InventoryLedger> InventoryLedgers => Set<InventoryLedger>();
    public DbSet<InventoryReconciliationReport> InventoryReconciliationReports => Set<InventoryReconciliationReport>();
    public DbSet<WarehouseRoute> WarehouseRoutes => Set<WarehouseRoute>();
    public DbSet<TransitDiscrepancy> TransitDiscrepancies => Set<TransitDiscrepancy>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        builder.AddInboxStateEntity();
        builder.AddOutboxMessageEntity();
        builder.AddOutboxStateEntity();

        builder.ApplyConfigurationsFromAssembly(typeof(WMSDbContext).Assembly);
    }
}
