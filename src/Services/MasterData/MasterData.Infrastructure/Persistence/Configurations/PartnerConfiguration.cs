using MasterData.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MasterData.Infrastructure.Persistence.Configurations;

public class PartnerConfiguration : IEntityTypeConfiguration<Partner>
{
    public void Configure(EntityTypeBuilder<Partner> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TenantId).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(20);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(20);
        builder.Property(x => x.City).HasMaxLength(50);

        // Đảm bảo Code là duy nhất trong cùng 1 Tenant
        builder.HasIndex(x => new { x.TenantId, x.Code }).IsUnique();
        
        // Index để tìm nhanh theo số điện thoại (hỗ trợ Trace)
        builder.HasIndex(x => new { x.TenantId, x.Phone });
    }
}
