using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class ErpSkuMirrorConfiguration : IEntityTypeConfiguration<ErpSkuMirror>
{
    public void Configure(EntityTypeBuilder<ErpSkuMirror> builder)
    {
        builder.ToTable("erp_skus");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ErpSkuId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.SkuCode).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(250).IsRequired();
        builder.Property(x => x.UnitOfMeasure).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(50).IsRequired();

        builder.HasIndex(x => new { x.TenantId, x.ErpSkuId }).IsUnique();
        builder.HasIndex(x => new { x.TenantId, x.SkuCode }).IsUnique();
    }
}
