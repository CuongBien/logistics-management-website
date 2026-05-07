using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InventoryReconciliationReportConfiguration : IEntityTypeConfiguration<InventoryReconciliationReport>
{
    public void Configure(EntityTypeBuilder<InventoryReconciliationReport> builder)
    {
        builder.ToTable("InventoryReconciliationReports");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Sku).IsRequired().HasMaxLength(100);
        builder.Property(x => x.DetectedAt).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.ResolutionNotes).HasMaxLength(500);

        builder.HasIndex(x => new { x.Sku, x.Status });
        builder.HasIndex(x => x.DetectedAt);
    }
}
