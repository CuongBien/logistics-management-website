using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class ShipmentOrderConfiguration : IEntityTypeConfiguration<ShipmentOrder>
{
    public void Configure(EntityTypeBuilder<ShipmentOrder> builder)
    {
        builder.ToTable("ShipmentOrders");
        builder.HasKey(o => o.Id);

        builder.Property(o => o.ShipmentId).IsRequired();
        builder.Property(o => o.OutboundOrderId).IsRequired();

        // Unique constraint from plan
        builder.HasIndex(o => new { o.ShipmentId, o.OutboundOrderId }).IsUnique();
    }
}
