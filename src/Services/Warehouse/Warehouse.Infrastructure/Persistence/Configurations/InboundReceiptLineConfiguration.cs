using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundReceiptLineConfiguration : IEntityTypeConfiguration<InboundReceiptLine>
{
    public void Configure(EntityTypeBuilder<InboundReceiptLine> builder)
    {
        builder.ToTable("InboundReceiptLines");

        builder.HasKey(il => il.Id);

        builder.Property(il => il.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(il => il.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(il => il.ReceiptId).IsRequired();
        builder.Property(il => il.Sku).HasMaxLength(100).IsRequired();
        builder.Property(il => il.ExpectedQuantity).IsRequired();
        builder.Property(il => il.ReceivedQuantity).IsRequired();
        builder.Property(il => il.LotNo).HasMaxLength(100);
        builder.Property(il => il.ExpiryDate);
        builder.Property(il => il.IsDeleted).IsRequired();
        builder.Property(il => il.DeletedAt);

        builder.HasIndex(il => new { il.ReceiptId, il.Sku })
               .IsUnique()
               .HasFilter("\"IsDeleted\" = false");

        builder.HasMany(il => il.Allocations)
               .WithOne(iba => iba.ReceiptLine)
               .HasForeignKey(iba => iba.ReceiptLineId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}