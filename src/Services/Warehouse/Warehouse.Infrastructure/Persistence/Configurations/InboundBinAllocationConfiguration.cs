using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundBinAllocationConfiguration : IEntityTypeConfiguration<InboundBinAllocation>
{
    public void Configure(EntityTypeBuilder<InboundBinAllocation> builder)
    {
        builder.ToTable("InboundBinAllocations");
        builder.HasKey(alloc => alloc.Id);

        builder.Property(alloc => alloc.ReceiptLineId).IsRequired();
        builder.Property(alloc => alloc.BinId).IsRequired();
        builder.Property(alloc => alloc.AllocatedQty).IsRequired();
        builder.Property(alloc => alloc.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(alloc => alloc.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(alloc => alloc.IsDeleted).IsRequired();
        builder.Property(alloc => alloc.DeletedAt);

        builder.HasOne(alloc => alloc.Bin)
            .WithMany()
            .HasForeignKey(alloc => alloc.BinId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
