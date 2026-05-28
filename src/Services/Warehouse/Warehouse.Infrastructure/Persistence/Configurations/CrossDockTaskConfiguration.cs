using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class CrossDockTaskConfiguration : IEntityTypeConfiguration<CrossDockTask>
{
    public void Configure(EntityTypeBuilder<CrossDockTask> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TenantId).IsRequired().HasMaxLength(50);
        builder.Property(t => t.Sku).IsRequired().HasMaxLength(100);
        builder.Property(t => t.AssignedOperatorId).HasMaxLength(100);

        builder.HasIndex(t => new { t.WarehouseId, t.Status });
        builder.HasIndex(t => t.OutboundOrderId);
        builder.HasIndex(t => t.ReceiptId);
    }
}
