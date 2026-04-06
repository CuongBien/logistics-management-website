using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.HasKey(x => x.Sku);

        builder.Property(x => x.Sku).IsRequired();
        builder.Property(x => x.Quantity).IsRequired();
        builder.Property(x => x.Version).IsRowVersion();
    }
}
