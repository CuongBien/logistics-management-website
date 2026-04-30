using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public sealed class OperatorWarehouseScopeConfiguration : IEntityTypeConfiguration<OperatorWarehouseScope>
{
    public void Configure(EntityTypeBuilder<OperatorWarehouseScope> builder)
    {
        builder.ToTable("operator_warehouse_scopes");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.OperatorProfileId).IsRequired();
        builder.Property(x => x.WarehouseId).IsRequired();

        builder.HasIndex(x => new { x.OperatorProfileId, x.WarehouseId }).IsUnique();

        builder
            .HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.WarehouseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
