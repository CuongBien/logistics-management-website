using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable(t => {
            t.HasCheckConstraint("CK_InventoryItem_QtyOnHand_Positive", "\"QuantityOnHand\" >= 0");
            t.HasCheckConstraint("CK_InventoryItem_ReservedQty_Positive", "\"ReservedQty\" >= 0");
            t.HasCheckConstraint("CK_InventoryItem_ReservedQty_Lte_OnHand", "\"ReservedQty\" <= \"QuantityOnHand\"");
        });

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WarehouseId).IsRequired();
        builder.Property(x => x.BinId).IsRequired();
        builder.Property(x => x.Sku).IsRequired().HasMaxLength(100);

        builder.HasIndex(x => new { x.TenantId, x.WarehouseId, x.Sku, x.BinId }).IsUnique();

        builder.Property(x => x.QuantityOnHand).IsRequired();
        builder.Property(x => x.ReservedQty).IsRequired();
        builder.Ignore(x => x.AvailableQty);
        builder.Property(x => x.LastRestockedAt);

        builder.Property(x => x.Version).IsConcurrencyToken();
    }
}
