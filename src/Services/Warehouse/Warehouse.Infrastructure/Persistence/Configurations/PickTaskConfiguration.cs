using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class PickTaskConfiguration : IEntityTypeConfiguration<PickTask>
{
    public void Configure(EntityTypeBuilder<PickTask> builder)
    {
        builder.ToTable("PickTasks");
        builder.HasKey(p => p.Id);

        builder.Property(p => p.OutboundLineId).IsRequired();
        builder.Property(p => p.FromBinId).IsRequired();
        builder.Property(p => p.Status).IsRequired();

        // Required Indexes from plan
        builder.HasIndex(p => new { p.OutboundLineId, p.Status });
        builder.HasIndex(p => new { p.FromBinId, p.Status });
    }
}
