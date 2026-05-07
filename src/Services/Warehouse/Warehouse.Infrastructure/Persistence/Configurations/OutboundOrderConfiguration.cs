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

        builder.Property(o => o.OrderNo).IsRequired().HasMaxLength(50);
        builder.Property(o => o.WarehouseId).IsRequired();
        builder.Property(o => o.Status).IsRequired();
        
        // Required Indexes from plan
        builder.HasIndex(o => new { o.WarehouseId, o.Status, o.PlannedShipAt });

        builder.HasMany(o => o.Lines)
            .WithOne()
            .HasForeignKey(l => l.OutboundOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
