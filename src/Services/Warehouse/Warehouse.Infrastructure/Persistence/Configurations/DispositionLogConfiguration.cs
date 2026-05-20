using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public class DispositionLogConfiguration : IEntityTypeConfiguration<DispositionLog>
{
    public void Configure(EntityTypeBuilder<DispositionLog> builder)
    {
        builder.ToTable("DispositionLogs");
        builder.HasKey(log => log.Id);

        builder.Property(log => log.InventoryItemId).IsRequired();
        builder.Property(log => log.InboundLineId); // Soft link
        
        builder.Property(log => log.InventoryStatus).HasConversion<string>().HasMaxLength(50).IsRequired();
        builder.Property(log => log.Status).HasConversion<string>().HasMaxLength(50).IsRequired();
        
        builder.Property(log => log.CreatedAt).IsRequired();
        builder.Property(log => log.Notes).HasMaxLength(1000);

        builder.HasOne(log => log.InventoryItem)
            .WithMany()
            .HasForeignKey(log => log.InventoryItemId)
            .OnDelete(DeleteBehavior.Cascade);
            
        // Note: No physical FK constraint for InboundLineId because it belongs to the Inbound context
    }
}
