using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class ShipmentItemConfiguration : IEntityTypeConfiguration<ShipmentItem>
{
    public void Configure(EntityTypeBuilder<ShipmentItem> builder)
    {
        builder.ToTable("ShipmentItems");
        builder.HasKey(i => i.Id);

        builder.Property(i => i.ShipmentId).IsRequired();
        builder.Property(i => i.OutboundLineId).IsRequired();
        
        // Required index
        builder.HasIndex(i => new { i.ShipmentId, i.OutboundLineId });
    }
}
