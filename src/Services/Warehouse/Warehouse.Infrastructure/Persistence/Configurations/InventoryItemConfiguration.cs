using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.Sku).IsUnique();

        builder.Property(x => x.Sku).HasMaxLength(100).IsRequired();
        builder.Property(x => x.QuantityOnHand).IsRequired();
        builder.Property(x => x.ReservedQty).IsRequired();
        builder.Property(x => x.LastRestockedAt);
        builder.Property(x => x.Version).IsRowVersion();
    }
}
