using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public sealed class OperatorProfileConfiguration : IEntityTypeConfiguration<OperatorProfile>
{
    public void Configure(EntityTypeBuilder<OperatorProfile> builder)
    {
        builder.ToTable("operator_profiles");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.OperatorSub).HasMaxLength(150).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(150);
        builder.Property(x => x.Email).HasMaxLength(150);
        builder.Property(x => x.Phone).HasMaxLength(50);
        builder.Property(x => x.EmployeeCode).HasMaxLength(50);

        builder.HasIndex(x => new { x.TenantId, x.OperatorSub }).IsUnique();
    }
}
