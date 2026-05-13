using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundBinAllocationConfiguration : IEntityTypeConfiguration<InboundBinAllocation>
{
    public void Configure(EntityTypeBuilder<InboundBinAllocation> builder)
    {
        builder.ToTable("InboundBinAllocations");

        builder.HasKey(iba => iba.Id);

        builder.Property(iba => iba.ReceiptLineId).IsRequired();
        builder.Property(iba => iba.BinId).IsRequired();
        builder.Property(iba => iba.Quantity).IsRequired();
        builder.Property(iba => iba.TenantId).HasMaxLength(100).IsRequired();
        
        builder.Property(iba => iba.Status)
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(iba => iba.IsDeleted).IsRequired();
        builder.Property(iba => iba.DeletedAt);

        builder.HasIndex(iba => new { iba.ReceiptLineId, iba.BinId, iba.TenantId })
               .IsUnique()
               .HasFilter("\"IsDeleted\" = false");

        builder.HasOne(iba => iba.Bin)
               .WithMany()
               .HasForeignKey(iba => iba.BinId)
               .OnDelete(DeleteBehavior.Restrict);
    }
}
