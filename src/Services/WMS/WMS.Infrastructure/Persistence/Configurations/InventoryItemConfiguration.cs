using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WMS.Domain.Entities;

namespace WMS.Infrastructure.Persistence.Configurations;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.Sku)
            .IsUnique();

        builder.Property(x => x.Sku)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.RowVersion)
            .IsRowVersion();
    }
}
