using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WarehouseId).IsRequired();

        builder.Property(x => x.DestinationType)
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(x => x.DestinationId).HasMaxLength(100).IsRequired();

        builder.Property(x => x.Status)
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(x => x.ShippedAt);
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasIndex(x => new { x.WarehouseId, x.Status, x.ShippedAt });
    }
}
