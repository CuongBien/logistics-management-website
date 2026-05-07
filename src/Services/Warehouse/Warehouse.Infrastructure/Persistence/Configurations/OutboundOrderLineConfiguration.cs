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

        builder.Property(l => l.SkuCode).IsRequired().HasMaxLength(100);
        
        // Removed Unique index as requested: No Unique(OutboundOrderId, SkuCode)
        builder.HasIndex(l => new { l.OutboundOrderId, l.SkuCode }); // Just a normal index for fast lookup
    }
}
