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
        builder.HasIndex(z => new { z.BlockId, z.ZoneType })
               .HasFilter("\"IsDeleted\" = false");

        builder.Property(z => z.IsDeleted).IsRequired();
        builder.Property(z => z.DeletedAt);

        builder.HasOne(z => z.Block)
            .WithMany(b => b.Zones)
            .HasForeignKey(z => z.BlockId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(z => z.Bins)
            .WithOne(b => b.Zone)
            .HasForeignKey(b => b.ZoneId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed Data
        builder.HasData(
            new {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                BlockId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ZoneType = "Storage",
                IsDeleted = false
            },
            new {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                BlockId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                ZoneType = "Storage",
                IsDeleted = false
            }
        );
    }
}