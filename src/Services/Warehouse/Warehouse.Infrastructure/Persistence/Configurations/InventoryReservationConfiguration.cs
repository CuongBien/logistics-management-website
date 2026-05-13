using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Warehouse.Domain.Entities;

namespace Warehouse.Infrastructure.Persistence.Configurations;

public sealed class InventoryReservationConfiguration : IEntityTypeConfiguration<InventoryReservation>
{
    public void Configure(EntityTypeBuilder<InventoryReservation> builder)
    {
        builder.ToTable("inventory_reservations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ReferenceId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.CorrelationId).HasMaxLength(150);

        builder.HasOne(x => x.InventoryItem)
            .WithMany()
            .HasForeignKey(x => x.InventoryItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.InventoryItemId, x.Status, x.ExpiresAt });
        builder.HasIndex(x => new { x.ReferenceId, x.ReferenceType, x.Status });
        builder.HasIndex(x => x.CorrelationId);
    }
}
