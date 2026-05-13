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
    DbSet<InboundReceipt> InboundReceipts { get; }
    DbSet<InboundReceiptLine> InboundReceiptLines { get; }
    DbSet<InboundBinAllocation> InboundBinAllocations { get; }
    DbSet<DispositionLog> DispositionLogs { get; }
    DbSet<OperatorProfile> OperatorProfiles { get; }
    DbSet<OperatorWarehouseScope> OperatorWarehouseScopes { get; }
    DbSet<ErpSkuMirror> ErpSkuMirrors { get; }
    DbSet<ErpWarehouseMirror> ErpWarehouseMirrors { get; }
    DbSet<ErpSyncCheckpoint> ErpSyncCheckpoints { get; }
    DbSet<OutboundOrder> OutboundOrders { get; }
    DbSet<OutboundOrderLine> OutboundOrderLines { get; }
    DbSet<Shipment> Shipments { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
