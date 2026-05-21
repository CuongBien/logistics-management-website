using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundDiscrepancyConfiguration : IEntityTypeConfiguration<InboundDiscrepancy>
{
    public void Configure(EntityTypeBuilder<InboundDiscrepancy> builder)
    {
        builder.ToTable("InboundDiscrepancies");

        builder.HasKey(td => td.Id);

        builder.Property(td => td.Sku).HasMaxLength(100).IsRequired();
        builder.Property(td => td.OperatorId).HasMaxLength(100).IsRequired();
        builder.Property(td => td.Status).IsRequired();
        builder.Property(td => td.CreatedAt).IsRequired();

        // Indexes for fast lookup
        builder.HasIndex(td => td.ReceiptId);
        builder.HasIndex(td => td.WarehouseId);
    }
}
