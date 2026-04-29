using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Ordering.Domain.Entities;

namespace Ordering.Infrastructure.Persistence.Configurations;

public class ErpWarehouseMirrorConfiguration : IEntityTypeConfiguration<ErpWarehouseMirror>
{
    public void Configure(EntityTypeBuilder<ErpWarehouseMirror> builder)
    {
        builder.ToTable("erp_warehouses");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ErpWarehouseId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WarehouseCode).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(250).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();

        builder.HasIndex(x => new { x.TenantId, x.ErpWarehouseId }).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.WarehouseCode }).IsUnique();
    }
}
