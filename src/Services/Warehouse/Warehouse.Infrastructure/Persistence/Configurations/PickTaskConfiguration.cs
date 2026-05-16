using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class PickTaskConfiguration : IEntityTypeConfiguration<PickTask>
{
    public void Configure(EntityTypeBuilder<PickTask> builder)
    {
        builder.ToTable("PickTasks");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.Quantity).IsRequired();
        builder.Property(x => x.AssignedOperatorId).HasMaxLength(100);
        builder.Property(x => x.WaveId).HasMaxLength(50);
        builder.Property(x => x.PickedAt);
        builder.Property(x => x.CreatedAt).IsRequired();
        
        builder.HasOne(x => x.OutboundOrderLine)
               .WithMany()
               .HasForeignKey(x => x.OutboundOrderLineId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.OutboundOrderLineId, x.Status });
        builder.HasIndex(x => x.FromBinId);
        builder.HasIndex(x => x.WaveId);
    }
}
