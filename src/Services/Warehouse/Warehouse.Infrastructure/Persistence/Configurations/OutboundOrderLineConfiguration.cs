using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OutboundOrderLineConfiguration : IEntityTypeConfiguration<OutboundOrderLine>
{
    public void Configure(EntityTypeBuilder<OutboundOrderLine> builder)
    {
        builder.ToTable("OutboundOrderLines");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.OutboundOrderId).IsRequired();
        builder.Property(l => l.SkuCode).HasMaxLength(100).IsRequired();
        builder.Property(l => l.RequestedQty).IsRequired();
        builder.Property(l => l.Uom).HasMaxLength(32).IsRequired();

        builder.HasIndex(l => new { l.OutboundOrderId, l.SkuCode });
    }
}
