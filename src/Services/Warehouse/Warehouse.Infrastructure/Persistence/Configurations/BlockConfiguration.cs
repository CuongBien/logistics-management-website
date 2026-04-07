using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class BlockConfiguration : IEntityTypeConfiguration<Block>
{
    public void Configure(EntityTypeBuilder<Block> builder)
    {
        builder.ToTable("Blocks");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BlockCode).HasMaxLength(50).IsRequired();

        builder.HasOne(b => b.Warehouse)
            .WithMany(w => w.Blocks)
            .HasForeignKey(b => b.WarehouseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Zones)
            .WithOne(z => z.Block)
            .HasForeignKey(z => z.BlockId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}