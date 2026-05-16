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
        builder.Property(x => x.ShipmentNo).HasMaxLength(50).IsRequired();
        
        builder.Property(x => x.DestinationType).HasConversion<int>().IsRequired();
        builder.Property(x => x.DestinationId).HasMaxLength(100).IsRequired();
        
        builder.Property(x => x.Carrier).HasMaxLength(100);
        builder.Property(x => x.RouteId).HasMaxLength(100);
        builder.Property(x => x.TrackingNo).HasMaxLength(100);
        
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.Property(x => x.ShippedAt);

        builder.HasIndex(x => x.ShipmentNo).IsUnique();
        builder.HasIndex(x => new { x.WarehouseId, x.Status, x.DestinationId });
    }
}

public class ShipmentItemConfiguration : IEntityTypeConfiguration<ShipmentItem>
{
    public void Configure(EntityTypeBuilder<ShipmentItem> builder)
    {
        builder.ToTable("ShipmentItems");
        builder.HasKey(x => x.Id); // Changed to use Entity Id as primary key, or use Composite if preferred

        builder.HasOne(x => x.Shipment)
               .WithMany(x => x.Items)
               .HasForeignKey(x => x.ShipmentId);

        builder.HasOne(x => x.OutboundOrderLine)
               .WithMany()
               .HasForeignKey(x => x.OutboundOrderLineId);
    }
}

public class ShipmentOrderConfiguration : IEntityTypeConfiguration<ShipmentOrder>
{
    public void Configure(EntityTypeBuilder<ShipmentOrder> builder)
    {
        builder.ToTable("ShipmentOrders");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Shipment)
               .WithMany(x => x.Orders)
               .HasForeignKey(x => x.ShipmentId);

        builder.HasOne(x => x.OutboundOrder)
               .WithMany()
               .HasForeignKey(x => x.OutboundOrderId);
    }
}
