using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class OperatorRoleAssignmentConfiguration : IEntityTypeConfiguration<OperatorRoleAssignment>
{
    public void Configure(EntityTypeBuilder<OperatorRoleAssignment> builder)
    {
        builder.ToTable("OperatorRoleAssignments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.HasOne(a => a.OperatorProfile)
            .WithMany(op => op.RoleAssignments)
            .HasForeignKey(a => a.OperatorProfileId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Warehouse)
            .WithMany()
            .HasForeignKey(a => a.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Zone)
            .WithMany()
            .HasForeignKey(a => a.ZoneId)
            .OnDelete(DeleteBehavior.Restrict);
            
        builder.HasIndex(a => new { a.OperatorProfileId, a.WarehouseId, a.RoleId, a.ZoneId }).IsUnique();
    }
}
