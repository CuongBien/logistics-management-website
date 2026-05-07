using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.ShipmentNo).IsRequired().HasMaxLength(50);
        builder.HasIndex(s => s.ShipmentNo).IsUnique(); // unique constraint

        builder.Property(s => s.WarehouseId).IsRequired();
        builder.Property(s => s.Status).IsRequired();
        
        // Required Indexes from plan
        builder.HasIndex(s => new { s.WarehouseId, s.Status, s.ShippedAt });

        builder.HasMany(s => s.Items)
            .WithOne()
            .HasForeignKey(i => i.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasMany(s => s.Orders)
            .WithOne()
            .HasForeignKey(o => o.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
