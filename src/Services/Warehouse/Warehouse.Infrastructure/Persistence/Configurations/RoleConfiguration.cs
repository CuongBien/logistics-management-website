using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Code).HasMaxLength(100).IsRequired();
        builder.Property(r => r.Name).HasMaxLength(255).IsRequired();
        builder.Property(r => r.IsActive).IsRequired();

        builder.HasIndex(r => r.Code).IsUnique();

        builder.HasMany(r => r.RolePermissions)
            .WithOne(rp => rp.Role)
            .HasForeignKey(rp => rp.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Assignments)
            .WithOne(a => a.Role)
            .HasForeignKey(a => a.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
