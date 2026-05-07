using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryLedgerConfiguration : IEntityTypeConfiguration<InventoryLedger>
{
    public void Configure(EntityTypeBuilder<InventoryLedger> builder)
    {
        builder.ToTable("InventoryLedger");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Sku).IsRequired().HasMaxLength(100);
        builder.Property(x => x.WarehouseId).IsRequired();
        builder.Property(x => x.BinId).IsRequired();
        builder.Property(x => x.DeltaQty).IsRequired();
        builder.Property(x => x.Reason).IsRequired();
        builder.Property(x => x.OccurredAt).IsRequired();

        builder.HasIndex(x => new { x.Sku, x.WarehouseId, x.OccurredAt });
        builder.HasIndex(x => x.CorrelationId);
    }
}
