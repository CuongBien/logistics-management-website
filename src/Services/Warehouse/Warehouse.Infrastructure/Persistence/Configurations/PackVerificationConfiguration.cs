using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class PackVerificationConfiguration : IEntityTypeConfiguration<PackVerification>
{
    public void Configure(EntityTypeBuilder<PackVerification> builder)
    {
        builder.ToTable("PackVerifications");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.OutboundOrderId).IsRequired();
        builder.Property(x => x.Sku).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ScannedQty).IsRequired();
        builder.Property(x => x.OperatorId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.LastScannedAt).IsRequired();

        // Unique index per order and SKU
        builder.HasIndex(x => new { x.OutboundOrderId, x.Sku }).IsUnique();
    }
}
