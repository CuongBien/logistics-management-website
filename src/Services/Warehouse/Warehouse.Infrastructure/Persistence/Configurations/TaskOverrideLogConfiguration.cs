using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class TaskOverrideLogConfiguration : IEntityTypeConfiguration<TaskOverrideLog>
{
    public void Configure(EntityTypeBuilder<TaskOverrideLog> builder)
    {
        builder.ToTable("TaskOverrideLogs");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TenantId).HasMaxLength(50).IsRequired();
        builder.Property(t => t.OperatorId).HasMaxLength(50).IsRequired();
        builder.Property(t => t.TaskType).HasMaxLength(20).IsRequired();
        builder.Property(t => t.Sku).HasMaxLength(50).IsRequired();
        builder.Property(t => t.OriginalBinCode).HasMaxLength(50).IsRequired();
        builder.Property(t => t.ActualBinCode).HasMaxLength(50).IsRequired();
        builder.Property(t => t.Reason).HasMaxLength(500).IsRequired(false);
        builder.Property(t => t.CreatedAt).IsRequired();

        builder.HasIndex(t => new { t.WarehouseId, t.OperatorId });
        builder.HasIndex(t => t.TaskId);
    }
}
