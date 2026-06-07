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
    DbSet<InventoryReservation> InventoryReservations { get; }
    DbSet<InboundReceipt> InboundReceipts { get; }
    DbSet<InboundReceiptLine> InboundReceiptLines { get; }
    DbSet<InboundBinAllocation> InboundBinAllocations { get; }
    DbSet<OperatorProfile> OperatorProfiles { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }
    DbSet<OperatorRoleAssignment> OperatorRoleAssignments { get; }

    DbSet<ErpSkuMirror> ErpSkuMirrors { get; }
    DbSet<ErpWarehouseMirror> ErpWarehouseMirrors { get; }
    DbSet<ErpSyncCheckpoint> ErpSyncCheckpoints { get; }
    
    // Outbound
    DbSet<OutboundOrder> OutboundOrders { get; }
    DbSet<OutboundOrderLine> OutboundOrderLines { get; }
    DbSet<PickTask> PickTasks { get; }
    DbSet<Wave> Waves { get; }
    DbSet<OutboundReturn> OutboundReturns { get; }
    
    DbSet<Shipment> Shipments { get; }
    DbSet<ShipmentItem> ShipmentItems { get; }
    DbSet<ShipmentOrder> ShipmentOrders { get; }

    DbSet<InventoryLedger> InventoryLedgers { get; }
    DbSet<InventoryReconciliationReport> InventoryReconciliationReports { get; }
    DbSet<WarehouseRoute> WarehouseRoutes { get; }
    DbSet<TransitDiscrepancy> TransitDiscrepancies { get; }
    DbSet<InboundDiscrepancy> InboundDiscrepancies { get; }
    DbSet<CountTask> CountTasks { get; }
    DbSet<ReplenishmentTask> ReplenishmentTasks { get; }
    DbSet<CrossDockTask> CrossDockTasks { get; }
    DbSet<PutawayTask> PutawayTasks { get; }
    DbSet<PackVerification> PackVerifications { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<OperatorActivityLog> OperatorActivityLogs { get; }
    
    Microsoft.EntityFrameworkCore.ChangeTracking.ChangeTracker ChangeTracker { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
