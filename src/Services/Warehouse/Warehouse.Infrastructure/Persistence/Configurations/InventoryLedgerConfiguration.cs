using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryLedgerConfiguration : IEntityTypeConfiguration<InventoryLedger>
{
    public void Configure(EntityTypeBuilder<InventoryLedger> builder)
    {
        builder.ToTable("InventoryLedgers");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.InventoryItemId).IsRequired();
        builder.Property(x => x.Sku).IsRequired().HasMaxLength(100);
        builder.Property(x => x.WarehouseId).IsRequired();
        builder.Property(x => x.BinId).IsRequired();
        
        builder.Property(x => x.Reason).IsRequired();
        builder.Property(x => x.DeltaQty).IsRequired();
        builder.Property(x => x.BalanceAfter).IsRequired();
        builder.Property(x => x.ReferenceId).HasMaxLength(100);
        builder.Property(x => x.ReferenceType).HasMaxLength(50);
        builder.Property(x => x.OccurredAt).IsRequired();

        // Index theo SKU và Kho (từ draft của user)
        builder.HasIndex(x => new { x.Sku, x.WarehouseId, x.OccurredAt });
        
        builder.HasIndex(x => x.ReferenceId);
        builder.HasIndex(x => x.CorrelationId);

        builder.HasOne(x => x.InventoryItem)
            .WithMany()
            .HasForeignKey(x => x.InventoryItemId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
