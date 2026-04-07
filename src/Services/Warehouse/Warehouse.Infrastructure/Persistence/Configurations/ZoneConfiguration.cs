using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class ZoneConfiguration : IEntityTypeConfiguration<Zone>
{
    public void Configure(EntityTypeBuilder<Zone> builder)
    {
        builder.ToTable("Zones");

        builder.HasKey(z => z.Id);

        builder.Property(z => z.ZoneType).HasMaxLength(50).IsRequired();

        builder.HasOne(z => z.Block)
            .WithMany(b => b.Zones)
            .HasForeignKey(z => z.BlockId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(z => z.Bins)
            .WithOne(b => b.Zone)
            .HasForeignKey(b => b.ZoneId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}