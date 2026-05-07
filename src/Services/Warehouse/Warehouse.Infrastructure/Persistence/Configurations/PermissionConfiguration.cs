using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.ToTable("Permissions");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Code).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Resource).HasMaxLength(100).IsRequired();
        builder.Property(p => p.Action).HasMaxLength(100).IsRequired();
        builder.Property(p => p.IsActive).IsRequired();

        builder.HasIndex(p => p.Code).IsUnique();

        builder.HasMany(p => p.RolePermissions)
            .WithOne(rp => rp.Permission)
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Seed default permissions using anonymous types to bypass protected Id setter
        builder.HasData(
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), Code = "inbound:receive", Resource = "inbound", Action = "receive", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Code = "inbound:force_close", Resource = "inbound", Action = "force_close", IsActive = true }
        );
    }
}
