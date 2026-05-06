using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class BinConfiguration : IEntityTypeConfiguration<Bin>
{
    public void Configure(EntityTypeBuilder<Bin> builder)
    {
        builder.ToTable("Bins");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.BinCode).HasMaxLength(50).IsRequired();
        builder.Property(b => b.Status).HasMaxLength(20).IsRequired();
        builder.Property(b => b.CurrentOrderId).IsRequired(false);
        builder.Property(b => b.Version).IsConcurrencyToken();
        builder.Property(b => b.WarehouseId).IsRequired();

        builder.HasIndex(b => new { b.WarehouseId, b.BinCode }).IsUnique();
        builder.HasIndex(b => new { b.ZoneId, b.Status });

        builder.ToTable("Bins", t => {
            t.HasCheckConstraint("CK_Bin_Version_Positive", "\"Version\" >= 1");
        });

        builder.HasOne(b => b.Zone)
            .WithMany(z => z.Bins)
            .HasForeignKey(b => b.ZoneId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed Data
        builder.HasData(new[] {
            new {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                WarehouseId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                ZoneId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                BinCode = "BIN-A1-01",
                Status = "Available",
                Version = 1
            },
            new {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                WarehouseId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                ZoneId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                BinCode = "BIN-A1-02",
                Status = "Available",
                Version = 1
            },
            new {
                Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                WarehouseId = Guid.Parse("48b030da-e7ad-452f-90db-ddb01a613583"),
                ZoneId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                BinCode = "BIN-B1-01",
                Status = "Available",
                Version = 1
            }
        });
    }
}