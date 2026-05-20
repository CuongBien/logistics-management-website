using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public sealed class OperatorWarehouseScopeConfiguration : IEntityTypeConfiguration<OperatorWarehouseScope>
{
    public void Configure(EntityTypeBuilder<OperatorWarehouseScope> builder)
    {
        builder.ToTable("operator_warehouse_scopes");

        builder.HasKey(x => new { x.OperatorProfileId, x.WarehouseId });

        builder.HasOne(x => x.OperatorProfile)
            .WithMany(x => x.WarehouseScopes)
            .HasForeignKey(x => x.OperatorProfileId);

        builder.HasOne(x => x.Warehouse)
            .WithMany()
            .HasForeignKey(x => x.WarehouseId);
    }
}
