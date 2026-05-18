using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class TransitDiscrepancyConfiguration : IEntityTypeConfiguration<TransitDiscrepancy>
{
    public void Configure(EntityTypeBuilder<TransitDiscrepancy> builder)
    {
        builder.ToTable("TransitDiscrepancies");

        builder.HasKey(td => td.Id);

        builder.Property(td => td.Sku).HasMaxLength(100).IsRequired();
        builder.Property(td => td.Carrier).HasMaxLength(200).IsRequired();
        builder.Property(td => td.OperatorId).HasMaxLength(100).IsRequired();
        builder.Property(td => td.Status).IsRequired();
        builder.Property(td => td.CreatedAt).IsRequired();

        // Indexes for fast lookup
        builder.HasIndex(td => td.OutboundOrderId);
        builder.HasIndex(td => td.ShipmentId);
        builder.HasIndex(td => td.WarehouseId);
    }
}
