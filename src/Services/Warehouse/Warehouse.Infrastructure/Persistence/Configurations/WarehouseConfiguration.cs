using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Domain.Entities.Warehouse>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.Warehouse> builder)
    {
        builder.ToTable("Warehouses");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Name).HasMaxLength(200).IsRequired();
        builder.Property(w => w.LocationText).HasMaxLength(500).IsRequired();

        builder.HasMany(w => w.Blocks)
            .WithOne(b => b.Warehouse)
            .HasForeignKey(b => b.WarehouseId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed Data
        builder.HasData(new {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Hanoi Central Warehouse",
            LocationText = "Hanoi, Vietnam"
        });
    }
}