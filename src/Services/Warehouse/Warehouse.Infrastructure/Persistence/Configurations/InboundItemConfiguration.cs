using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundItemConfiguration : IEntityTypeConfiguration<InboundItem>
{
    public void Configure(EntityTypeBuilder<InboundItem> builder)
    {
        builder.ToTable("InboundItems");

        builder.HasKey(ii => ii.Id);

        builder.Property(ii => ii.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(ii => ii.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(ii => ii.ReceiptId).IsRequired();
        builder.Property(ii => ii.Sku).IsRequired();
        builder.Property(ii => ii.Quantity).IsRequired();
        builder.Property(ii => ii.BinId);
        builder.HasIndex(ii => new { ii.TenantId, ii.CustomerId, ii.Sku });

        builder.HasOne(ii => ii.Receipt)
            .WithMany(ir => ir.Items)
            .HasForeignKey(ii => ii.ReceiptId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ii => ii.Bin)
            .WithMany()
            .HasForeignKey(ii => ii.BinId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}