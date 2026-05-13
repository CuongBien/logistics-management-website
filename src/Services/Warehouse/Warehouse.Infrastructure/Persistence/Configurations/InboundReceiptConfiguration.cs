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
        
        builder.Property(ir => ir.ReceiptNo).HasMaxLength(100).IsRequired();
        builder.Property(ir => ir.ShipmentNo).HasMaxLength(100);
        builder.Property(ir => ir.SourceType).HasMaxLength(50).IsRequired();
        builder.Property(ir => ir.SourceRef).HasMaxLength(100).IsRequired();
        
        builder.Property(ir => ir.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(ir => ir.CreatedAt).IsRequired();
        builder.Property(ir => ir.ReceivedAt);
        builder.Property(ir => ir.IsDeleted).IsRequired();
        builder.Property(ir => ir.DeletedAt);

        // Idempotency Key
        builder.HasIndex(ir => new { ir.WarehouseId, ir.SourceType, ir.SourceRef, ir.ShipmentNo })
               .IsUnique()
               .HasFilter("\"IsDeleted\" = false");

        // Internal Key
        builder.HasIndex(ir => ir.ReceiptNo)
               .IsUnique()
               .HasFilter("\"IsDeleted\" = false");

        builder.HasMany(ir => ir.Lines)
            .WithOne(line => line.Receipt)
            .HasForeignKey(line => line.ReceiptId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}