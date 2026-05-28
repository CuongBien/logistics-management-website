using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class PutawayTaskConfiguration : IEntityTypeConfiguration<PutawayTask>
{
    public void Configure(EntityTypeBuilder<PutawayTask> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WarehouseId).IsRequired();
        builder.Property(x => x.ReceiptId).IsRequired();
        builder.Property(x => x.Sku).IsRequired().HasMaxLength(100);
        builder.Property(x => x.LotNo).HasMaxLength(100);
        builder.Property(x => x.Quantity).IsRequired();
        
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(50);
        builder.Property(x => x.OperatorId).HasMaxLength(100);

        builder.HasOne(x => x.SourceBin)
            .WithMany()
            .HasForeignKey(x => x.SourceBinId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.SuggestedBin)
            .WithMany()
            .HasForeignKey(x => x.SuggestedBinId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ActualBin)
            .WithMany()
            .HasForeignKey(x => x.ActualBinId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasIndex(x => new { x.WarehouseId, x.Status });
    }
}
