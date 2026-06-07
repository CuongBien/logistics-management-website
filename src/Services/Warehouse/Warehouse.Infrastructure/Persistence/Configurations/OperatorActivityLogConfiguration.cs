using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OperatorActivityLogConfiguration : IEntityTypeConfiguration<OperatorActivityLog>
{
    public void Configure(EntityTypeBuilder<OperatorActivityLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WarehouseId).IsRequired();
        builder.Property(x => x.OperatorId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.TaskType).HasMaxLength(50).IsRequired();
        builder.Property(x => x.TaskId).IsRequired();
        builder.Property(x => x.Sku).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Quantity).IsRequired();
        builder.Property(x => x.StartedAt).IsRequired();
        builder.Property(x => x.CompletedAt).IsRequired();
        builder.Property(x => x.DurationSeconds).IsRequired();

        builder.HasIndex(x => new { x.WarehouseId, x.OperatorId });
        builder.HasIndex(x => new { x.WarehouseId, x.CompletedAt });
    }
}
