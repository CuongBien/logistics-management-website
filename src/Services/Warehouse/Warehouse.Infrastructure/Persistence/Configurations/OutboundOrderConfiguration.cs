using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OutboundOrderConfiguration : IEntityTypeConfiguration<OutboundOrder>
{
    public void Configure(EntityTypeBuilder<OutboundOrder> builder)
    {
        builder.ToTable("OutboundOrders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WarehouseId).IsRequired();
        builder.Property(x => x.OrderId).IsRequired();
        builder.Property(x => x.OrderNo).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Destination).HasMaxLength(500);
        builder.Property(x => x.DestinationAddress).HasMaxLength(500);
        builder.Property(x => x.DestinationCity).HasMaxLength(100);
        
        builder.Property(x => x.Status)
               .HasConversion<int>()
               .IsRequired();

        builder.Property(x => x.Priority).IsRequired().HasDefaultValue(0);
        builder.Property(x => x.AllowPartial).IsRequired().HasDefaultValue(true);
        builder.Property(x => x.PlannedShipAt);
        builder.Property(x => x.CreatedAt).IsRequired();

        builder.HasMany(x => x.Lines)
               .WithOne(x => x.OutboundOrder)
               .HasForeignKey(x => x.OutboundOrderId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.WarehouseId, x.Status, x.PlannedShipAt });
        builder.HasIndex(x => new { x.TenantId, x.OrderNo }).IsUnique();
        builder.HasIndex(x => x.OrderId);
    }
}
