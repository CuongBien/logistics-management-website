using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ordering.Domain.Entities;

namespace Ordering.Infrastructure.Persistence.Configurations;

public class ErpSyncCheckpointConfiguration : IEntityTypeConfiguration<ErpSyncCheckpoint>
{
    public void Configure(EntityTypeBuilder<ErpSyncCheckpoint> builder)
    {
        builder.ToTable("erp_sync_checkpoints");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.LastSuccessCursor).HasMaxLength(200).IsRequired();

        builder.HasIndex(x => new { x.TenantId, x.EntityType }).IsUnique();
    }
}
