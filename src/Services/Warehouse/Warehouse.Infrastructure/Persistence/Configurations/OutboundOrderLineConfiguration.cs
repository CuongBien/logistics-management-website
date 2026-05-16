using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OutboundOrderLineConfiguration : IEntityTypeConfiguration<OutboundOrderLine>
{
    public void Configure(EntityTypeBuilder<OutboundOrderLine> builder)
    {
        builder.ToTable("OutboundOrderLines");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Sku).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Uom).HasMaxLength(20).IsRequired();
        
        builder.Property(x => x.RequestedQty).IsRequired();
        builder.Property(x => x.ReservedQty).IsRequired();
        builder.Property(x => x.PickedQty).IsRequired();
        builder.Property(x => x.PackedQty).IsRequired();
        builder.Property(x => x.ShippedQty).IsRequired();

        // Ràng buộc Unique SKU trên mỗi Order (đã chốt ở plan)
        builder.HasIndex(x => new { x.OutboundOrderId, x.Sku }).IsUnique();
    }
}
