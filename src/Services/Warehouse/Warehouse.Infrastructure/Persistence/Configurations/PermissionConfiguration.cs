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
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000002"), Code = "inbound:force_close", Resource = "inbound", Action = "force_close", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000003"), Code = "outbound:sort", Resource = "outbound", Action = "sort", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000004"), Code = "inventory:reserve", Resource = "inventory", Action = "reserve", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000005"), Code = "inventory:release", Resource = "inventory", Action = "release", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000006"), Code = "inventory:consume", Resource = "inventory", Action = "consume", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000007"), Code = "inbound:transit_receive", Resource = "inbound", Action = "transit_receive", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000008"), Code = "outbound:create", Resource = "outbound", Action = "create", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000009"), Code = "outbound:allocate", Resource = "outbound", Action = "allocate", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000010"), Code = "outbound:pick", Resource = "outbound", Action = "pick", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000011"), Code = "outbound:pack", Resource = "outbound", Action = "pack", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000012"), Code = "outbound:load", Resource = "outbound", Action = "load", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000013"), Code = "outbound:dispatch", Resource = "outbound", Action = "dispatch", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000014"), Code = "route:manage", Resource = "route", Action = "manage", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000015"), Code = "inventory:reconcile", Resource = "inventory", Action = "reconcile", IsActive = true },
            new { Id = Guid.Parse("00000000-0000-0000-0000-000000000016"), Code = "inbound:resolve_discrepancy", Resource = "inbound", Action = "resolve_discrepancy", IsActive = true }
        );
    }
}
