using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OutboundOrderConfiguration : IEntityTypeConfiguration<OutboundOrder>
{
    public void Configure(EntityTypeBuilder<OutboundOrder> builder)
    {
        builder.ToTable("OutboundOrders");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(o => o.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(o => o.WarehouseId).IsRequired();
        builder.Property(o => o.OrderId).IsRequired();
        
        builder.Property(o => o.Status)
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(o => o.PlannedShipAt);
        builder.Property(o => o.CreatedAt).IsRequired();

        builder.HasIndex(o => new { o.TenantId, o.OrderId }).IsUnique();
        builder.HasIndex(o => new { o.WarehouseId, o.Status, o.PlannedShipAt });

        builder.HasMany(o => o.Lines)
            .WithOne(l => l.Order)
            .HasForeignKey(l => l.OutboundOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
