using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class InboundReceiptConfiguration : IEntityTypeConfiguration<InboundReceipt>
{
    public void Configure(EntityTypeBuilder<InboundReceipt> builder)
    {
        builder.ToTable("InboundReceipts");

        builder.HasKey(ir => ir.Id);

        builder.Property(ir => ir.TenantId).HasMaxLength(100).IsRequired();
        builder.Property(ir => ir.CustomerId).HasMaxLength(100).IsRequired();
        builder.Property(ir => ir.WarehouseId).IsRequired();
        builder.Property(ir => ir.CreatedAt).IsRequired();
        builder.Property(ir => ir.SourceShipmentNo).HasMaxLength(100);
        builder.Property(ir => ir.OrderId).IsRequired();
        
        builder.Property(ir => ir.Status)
               .HasConversion<string>()
               .HasMaxLength(50)
               .IsRequired();

        builder.Property(ir => ir.ReceivedAt);
        builder.HasIndex(ir => new { ir.TenantId, ir.CustomerId, ir.OrderId, ir.WarehouseId }).IsUnique();
        builder.HasIndex(ir => ir.SourceShipmentNo);
        builder.HasIndex(ir => new { ir.WarehouseId, ir.CreatedAt }).IsDescending(false, true);

        builder.HasMany(ir => ir.Items)
            .WithOne(ii => ii.Receipt)
            .HasForeignKey(ii => ii.ReceiptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}