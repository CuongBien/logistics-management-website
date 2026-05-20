using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundReceiptLineConfiguration : IEntityTypeConfiguration<InboundReceiptLine>
{
    public void Configure(EntityTypeBuilder<InboundReceiptLine> builder)
    {
        builder.ToTable("InboundReceiptLines");
        builder.HasKey(line => line.Id);

        builder.Property(line => line.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(line => line.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(line => line.ReceiptId).IsRequired();
        builder.Property(line => line.LineNo).IsRequired();
        
        builder.Property(line => line.SkuCode).HasMaxLength(100).IsRequired();
        builder.Property(line => line.Uom).HasMaxLength(50).IsRequired();
        
        builder.Property(line => line.ExpectedQty).IsRequired();
        builder.Property(line => line.ReceivedQty).IsRequired();
        builder.Property(line => line.RejectedQty).IsRequired();
        builder.Property(line => line.RejectionReason).HasMaxLength(500);
        builder.Property(line => line.ShortageQty).IsRequired();
        
        builder.Property(line => line.LotNo).HasMaxLength(100);
        builder.Property(line => line.ExpiryDate);
        
        builder.Property(line => line.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        
        builder.Property(line => line.IsDeleted).IsRequired();
        builder.Property(line => line.DeletedAt);

        builder.HasIndex(line => new { line.ReceiptId, line.LineNo })
               .IsUnique()
               .HasFilter("\"IsDeleted\" = false");

        builder.HasMany(line => line.Allocations)
            .WithOne(alloc => alloc.ReceiptLine)
            .HasForeignKey(alloc => alloc.ReceiptLineId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
