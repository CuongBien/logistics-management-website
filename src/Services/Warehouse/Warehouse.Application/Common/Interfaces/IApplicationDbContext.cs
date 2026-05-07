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
    DbSet<OutboundOrder> OutboundOrders { get; }
    DbSet<Shipment> Shipments { get; }
    DbSet<InventoryLedger> InventoryLedgers { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
